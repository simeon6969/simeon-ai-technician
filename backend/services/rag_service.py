from sqlalchemy.orm import Session

from backend.services.ai_service import generate_ai_response
from backend.services.chat_service import search_maintenance_knowledge


INSUFFICIENT_EVIDENCE = (
    "I don't have enough reliable validated maintenance information "
    "to answer that question."
)


def build_evidence_fallback(context: list[dict]) -> str:
    """Return a traceable answer without adding unsupported claims."""
    lines = [
        "I found validated maintenance evidence, but the AI answer service "
        "is currently unavailable.",
        "",
        "Evidence available:"
    ]

    for item in context:
        lines.append(
            f"- Source job card #{item['source_job_card_id']} "
            f"({item['equipment']}): "
            f"{item['problem'] or 'Problem not recorded'}."
        )
        if item.get("symptoms"):
            lines.append(f"  Symptoms: {item['symptoms']}")
        if item.get("diagnosis"):
            lines.append(f"  Diagnosis: {item['diagnosis']}")
        if item.get("solution"):
            lines.append(f"  Recorded corrective action: {item['solution']}")
        if item.get("parts_used"):
            lines.append(f"  Parts used: {item['parts_used']}")

    lines.append("No additional procedure is asserted beyond these records.")
    return "\n".join(lines)


def retrieve_context(
    db: Session,
    question: str,
    limit: int = 5
):
    """
    Retrieve validated technical evidence.
    """

    results = search_maintenance_knowledge(
        db=db,
        question=question,
        limit=limit
    )

    context = []

    for item in results:
        context.append(
            {
                "equipment": (
                    f"{item['manufacturer']} "
                    f"{item['model']}"
                ),
                "problem": item["problem_description"],
                "symptoms": item["symptoms"],
                "diagnosis": item["diagnosis"],
                "solution": item["solution"],
                "parts_used": item["parts_used"],
                "confidence": item["confidence"],
                "source_job_card_id": item["source_job_card_id"]
            }
        )

    return context


def generate_rag_response(
    db: Session,
    question: str
):
    """
    Retrieve technical evidence and generate an
    evidence-grounded AI response.
    """

    context = retrieve_context(
        db=db,
        question=question
    )

    if not context:
        return {
            "answer": INSUFFICIENT_EVIDENCE,
            "knowledge_found": False,
            "sources": []
        }

    try:
        answer = generate_ai_response(
            question=question,
            context=context
        )
    except Exception:
        answer = build_evidence_fallback(context)

    return {
        "answer": answer,
        "knowledge_found": True,
        "sources": [
            {
                "source_job_card_id": item["source_job_card_id"],
                "equipment": item["equipment"],
                "confidence": item["confidence"]
            }
            for item in context
        ]
    }