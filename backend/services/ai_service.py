import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")


def get_openai_client():
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    return OpenAI(api_key=OPENAI_API_KEY)


SYSTEM_PROMPT = """
You are Simeon, an intelligent biomedical technician assistant.

Your role is to assist biomedical technicians with maintenance,
troubleshooting, equipment information, and spare-part knowledge.

IMPORTANT RULES:

1. Use the technical evidence provided to you.
2. Do not invent maintenance history, equipment faults,
   diagnoses, spare parts, or repair results.
3. If the evidence is insufficient, clearly say that you do
   not have enough reliable information.
4. Distinguish between information found in the knowledge base
   and general reasoning.
5. Do not expose technician account information, passwords,
   phone numbers, emails, or other private user information.
6. Do not claim that a repair procedure has been successfully
   performed unless the supplied evidence says so.
7. Give practical, technically structured answers suitable for
   a biomedical technician.
8. When relevant, identify the equipment model involved.
9. Treat the supplied evidence as the complete factual boundary.
    Do not add generic maintenance steps as if they were validated.
10. Cite record-specific claims with [Source job card #ID].
11. If the evidence does not answer the question, say that the
     available validated records are insufficient.
"""


def generate_ai_response(
    question: str,
    context: list[dict]
) -> str:

    if not context:
        return (
            "I don't have enough reliable maintenance information "
            "in my current knowledge base to answer this question."
        )

    client = get_openai_client()

    evidence_lines = []

    for index, item in enumerate(context, start=1):

        evidence_lines.append(
            f"""
EVIDENCE {index}

Equipment:
{item.get("equipment", "Unknown")}

Problem:
{item.get("problem") or "Not recorded"}

Symptoms:
{item.get("symptoms") or "Not recorded"}

Diagnosis:
{item.get("diagnosis") or "Not recorded"}

Solution:
{item.get("solution") or "Not recorded"}

Parts used:
{item.get("parts_used") or "Not recorded"}

Knowledge confidence:
{item.get("confidence", 0)}

Source job card:
{item.get("source_job_card_id", "Unknown")}
"""
        )

    evidence = "\n".join(evidence_lines)

    prompt = f"""
Technician question:

{question}

The following is retrieved technical evidence from Simeon's
validated maintenance knowledge base:

{evidence}

Answer the technician using only the evidence above where
specific maintenance facts are concerned.

Use these headings when applicable: Finding, Recorded evidence,
Recommended next step, Sources.

If the evidence does not adequately answer the question,
say so explicitly.

Do not fabricate missing technical information.
"""

    response = client.responses.create(
        model=OPENAI_MODEL,
        instructions=SYSTEM_PROMPT,
        input=prompt
    )

    return response.output_text