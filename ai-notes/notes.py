import json
import os

import httpx

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b")

SYSTEM_PROMPT = (
    "You summarize meeting transcripts into concise notes and action items. "
    "Only use what is actually said in the transcript — never invent participants, "
    "decisions, or action items that are not supported by it. If there are no clear "
    "action items, return an empty list. Respond with ONLY a JSON object of the exact "
    'shape {"summary": string, "actionItems": [{"text": string, "owner": string|null}]} '
    "— no other text before or after it."
)


async def generate_notes(transcript: str) -> dict:
    if not transcript:
        return {"summary": "", "actionItems": []}

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Meeting transcript:\n\n{transcript}\n\nSummarize the discussion and list any action items.",
                    },
                ],
                "format": "json",
                "stream": False,
            },
        )
        response.raise_for_status()
        content = response.json()["message"]["content"]

    parsed = json.loads(content)

    action_items = []
    for item in parsed.get("actionItems", []):
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        action_items.append({"text": text, "owner": item.get("owner") or None})

    return {"summary": str(parsed.get("summary", "")).strip(), "actionItems": action_items}
