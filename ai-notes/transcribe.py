import os

from faster_whisper import WhisperModel

WHISPER_MODEL_NAME = os.environ.get("WHISPER_MODEL", "base")
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

# Loaded once at import time (this module is imported once per process, by
# main.py at startup) so every request reuses the same in-memory model
# instead of reloading it from disk each time.
_model = WhisperModel(WHISPER_MODEL_NAME, device="cpu", compute_type=WHISPER_COMPUTE_TYPE)


def transcribe_file(path: str) -> str:
    segments, _info = _model.transcribe(path, beam_size=5)
    return " ".join(segment.text.strip() for segment in segments).strip()
