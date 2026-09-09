# ai-notes

A small FastAPI service that turns a meeting recording into a transcript, summary, and action items — fully locally, no external API calls:

- **Transcription** — [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (CTranslate2), CPU by default.
- **Summary + action items** — a local LLM served by [Ollama](https://ollama.com/), called over HTTP.

The main Next.js app (`services/aiNotes.client.ts`) POSTs a recording's raw audio bytes to `POST /process` and gets back:

```json
{ "transcript": "...", "summary": "...", "actionItems": [{ "text": "...", "owner": "Alice" }] }
```

The model is loaded into memory once at startup and reused for every request — that's the point of running this as a long-lived service instead of a per-call script.

## Run it directly (no Docker)

```bash
cd ai-notes
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # set OLLAMA_MODEL, AI_NOTES_SERVICE_TOKEN, etc.

# separately: make sure Ollama is running and has the model pulled
ollama pull qwen2.5:3b   # or whatever OLLAMA_MODEL is set to

set -a; source .env; set +a
uvicorn main:app --host 0.0.0.0 --port 8100
```

First request downloads the Whisper model (a few hundred MB, from Hugging Face) — expect it to be slow once, then fast.

## Run it via Docker Compose

Add this alongside the LiveKit/Redis/MinIO/Egress services already documented in the main `README.md`:

```yaml
services:
  ai-notes:
    build: ./ai-notes
    ports: ["127.0.0.1:8100:8100"]
    env_file: ["./ai-notes/.env"]
    volumes: ["./ai-notes-models:/models"]
    extra_hosts: ["host.docker.internal:host-gateway"]   # to reach a host-installed Ollama
    restart: unless-stopped
```

If Ollama also runs in Docker, point `OLLAMA_URL` at its service name instead (e.g. `http://ollama:11434`) and add it to the same Compose file rather than reaching for `host.docker.internal`.

## Sizing

- `WHISPER_MODEL`: `tiny`/`base` are fine on a small (2 vCPU) VPS; step up to `small`/`medium` only with more CPU headroom.
- `OLLAMA_MODEL`: a 3B-class model (`qwen2.5:3b`, `llama3.2:3b`) is a reasonable default for a small VPS. Larger models (7B+) give better summaries but need meaningfully more RAM and are slower per meeting.

## Health check

```bash
curl http://127.0.0.1:8100/health
```

## Production deployment

Deployed via `docker-compose.prod.yml` at the repo root as the `ai-notes`
service, alongside the main app. Its image is built and pushed to
`ghcr.io/jainbhavesh/confera-ai-notes` by `.github/workflows/deploy.yml`
whenever files under this directory change.
