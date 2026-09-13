import re
from difflib import SequenceMatcher

from sqlalchemy.orm import Session

from backend.models.equipment import Equipment
from backend.models.job_cards import JobCard
from backend.models.maintenance_knowledge import MaintenanceKnowledge


def search_maintenance_knowledge(
    db: Session,
    question: str,
    limit: int = 5
):
    """
    Retrieve validated maintenance knowledge using simple
    equipment-aware keyword matching.

    This is the MVP retrieval layer.
    It can later be upgraded to embedding/vector retrieval.
    """

    stop_words = {
        "what", "when", "where", "which", "with", "this", "that",
        "from", "should", "could", "would", "about", "have", "does",
        "into", "there", "their", "the", "and", "for", "how"
    }
    words = [
        word
        for word in re.findall(r"[a-z0-9]+", question.lower())
        if len(word) >= 3 and word not in stop_words
    ]

    if not words:
        return []

    records = (
        db.query(
            MaintenanceKnowledge,
            Equipment
        )
        .join(
            Equipment,
            MaintenanceKnowledge.equipment_id == Equipment.equipment_id
        )
        .join(
            JobCard,
            MaintenanceKnowledge.source_job_card_id == JobCard.job_card_id
        )
        .filter(
            MaintenanceKnowledge.successful.is_(True),
            JobCard.status == "validated",
            JobCard.successful.is_(True)
        )
        .order_by(
            MaintenanceKnowledge.created_at.desc()
        )
        .all()
    )

    results = []

    for knowledge, equipment in records:

        searchable_text = " ".join(
            filter(
                None,
                [
                    equipment.category,
                    equipment.manufacturer,
                    equipment.model,
                    equipment.description,
                    equipment.technical_specs,
                    knowledge.problem_description,
                    knowledge.symptoms,
                    knowledge.diagnosis,
                    knowledge.solution,
                    knowledge.parts_used
                ]
            )
        ).lower()

        searchable_tokens = set(re.findall(r"[a-z0-9]+", searchable_text))
        matched_words = []
        fuzzy_matches = []

        for word in words:
            if word in searchable_tokens:
                matched_words.append(word)
                continue

            close_token = next(
                (
                    token
                    for token in searchable_tokens
                    if len(word) >= 5
                    and len(token) >= 5
                    and SequenceMatcher(None, word, token).ratio() >= 0.84
                ),
                None
            )

            if close_token:
                fuzzy_matches.append(f"{word}~{close_token}")

        score = len(matched_words) + (0.5 * len(fuzzy_matches))

        if score > 0:
            results.append(
                {
                    "knowledge_id": knowledge.knowledge_id,
                    "source_job_card_id": knowledge.source_job_card_id,
                    "equipment_id": equipment.equipment_id,

                    "equipment_category": equipment.category,
                    "manufacturer": equipment.manufacturer,
                    "model": equipment.model,

                    "problem_description": knowledge.problem_description,
                    "symptoms": knowledge.symptoms,
                    "diagnosis": knowledge.diagnosis,
                    "solution": knowledge.solution,
                    "parts_used": knowledge.parts_used,

                    "confidence": float(knowledge.confidence),
                    "score": score,
                    "matched_terms": matched_words + fuzzy_matches
                }
            )

    results.sort(
        key=lambda item: (
            item["score"],
            item["confidence"]
        ),
        reverse=True
    )

    return results[:limit]


def generate_grounded_response(
    db: Session,
    question: str
):
    """
    Generate an evidence-grounded response.

    The current MVP uses retrieved validated records.
    The LLM will be connected later.
    """

    results = search_maintenance_knowledge(
        db=db,
        question=question
    )

    if not results:
        return {
            "answer": (
                "I don't have enough reliable maintenance information "
                "in my current knowledge base to answer this question."
            ),
            "knowledge_found": False,
            "sources": []
        }

    best = results[0]

    answer_parts = []

    answer_parts.append(
        f"I found a relevant validated maintenance record for "
        f"{best['manufacturer']} {best['model']}."
    )

    if best["problem_description"]:
        answer_parts.append(
            f"Recorded problem: {best['problem_description']}"
        )

    if best["symptoms"]:
        answer_parts.append(
            f"Recorded symptoms: {best['symptoms']}"
        )

    if best["diagnosis"]:
        answer_parts.append(
            f"Recorded diagnosis: {best['diagnosis']}"
        )

    if best["solution"]:
        answer_parts.append(
            f"Recorded corrective action: {best['solution']}"
        )

    if best["parts_used"]:
        answer_parts.append(
            f"Parts used: {best['parts_used']}"
        )

    if len(answer_parts) == 1:
        answer_parts.append(
            "However, the available record does not contain "
            "enough technical detail to provide further guidance."
        )

    return {
        "answer": "\n\n".join(answer_parts),
        "knowledge_found": True,
        "sources": [
            {
                "knowledge_id": item["knowledge_id"],
                "source_job_card_id": item["source_job_card_id"],
                "equipment_id": item["equipment_id"],
                "manufacturer": item["manufacturer"],
                "model": item["model"],
                "score": item["score"]
            }
            for item in results
        ]
    }