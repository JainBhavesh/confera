import os
import tempfile
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel

from notes import generate_notes
from transcribe import transcribe_file

# When set, /process requires this exact value in the X-Internal-Token
# header. Leave unset only if this service is bound to 127.0.0.1 and never
# reachable from outside the host.
INTERNAL_TOKEN = os.environ.get("AI_NOTES_SERVICE_TOKEN")

app = FastAPI(title="Conferra AI notes service")


class ActionItem(BaseModel):
    text: str
    owner: Optional[str] = None


class ProcessResponse(BaseModel):
    transcript: str
    summary: str
    actionItems: list[ActionItem]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/process", response_model=ProcessResponse)
async def process(request: Request, x_internal_token: Optional[str] = Header(default=None)):
    if INTERNAL_TOKEN and x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    audio_bytes = await request.body()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty request body")

    with tempfile.NamedTemporaryFile(suffix=".audio") as f:
        f.write(audio_bytes)
        f.flush()
        try:
            transcript = transcribe_file(f.name)
        except Exception as err:  # noqa: BLE001 — surfaced to the caller as a 500
            raise HTTPException(status_code=500, detail=f"Transcription failed: {err}") from err

    try:
        result = await generate_notes(transcript)
    except Exception as err:  # noqa: BLE001 — surfaced to the caller as a 500
        raise HTTPException(status_code=500, detail=f"Note generation failed: {err}") from err

    return ProcessResponse(transcript=transcript, summary=result["summary"], actionItems=result["actionItems"])
