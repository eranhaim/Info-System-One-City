import logging

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)

_STANDARDISE_PROMPT = """\
You are a knowledge-base builder for a small town community website.
You will receive the contents of multiple files (text, documents, CSVs,
images, etc.).  Your job is to consolidate ALL the information from every
file into a single, well-organised, RAG-optimised plain-text document.

Take your time. Be thorough and methodical. Completeness is the top priority.

Rules:
- Write in the SAME LANGUAGE as the source material (mostly Hebrew).
- Use clear headings and sub-headings.
- COMPLETENESS IS CRITICAL: include every single piece of information. Do NOT summarise, truncate, or skip data. Every row, entry, date, name, number, and detail must appear in the output.
- Keep every factual detail — names, dates, phone numbers, addresses, times, categories, types, etc.
- If a file is an image containing a table or schedule, transcribe EVERY row and EVERY column in full. Do not skip rows even if they look repetitive. Include ALL months, ALL dates, ALL categories.
- If an image contains multiple tables or sections, transcribe each one completely.
- Only remove information that is truly identical (exact same data appearing twice). Different dates, entries, or rows are NOT duplicates even if they follow a similar pattern.
- Output ONLY the consolidated knowledge text — no commentary.
"""

_MODEL = "gpt-4.1"


def standardise(file_texts: dict[str, str]) -> str:
    """Send all file texts to GPT-4.1 and get back a single consolidated document.

    Args:
        file_texts: mapping of filename -> extracted plain text

    Returns:
        The consolidated plain-text knowledge document.
    """
    if not file_texts:
        return ""

    parts: list[str] = []
    for filename, text in file_texts.items():
        parts.append(f"===== FILE: {filename} =====\n{text}")
    combined_input = "\n\n".join(parts)

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _STANDARDISE_PROMPT},
            {"role": "user", "content": combined_input},
        ],
        temperature=0.1,
    )

    result = response.choices[0].message.content or ""
    logger.info(
        "Standardised %d files (%d chars input) -> %d chars output",
        len(file_texts),
        len(combined_input),
        len(result),
    )
    return result
