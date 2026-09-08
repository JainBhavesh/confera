export type AiNotesActionItem = { text: string; owner: string | null };
export type AiNotesResult = { transcript: string; summary: string; actionItems: AiNotesActionItem[] };

/**
 * Sends a recording to the self-hosted ai-notes service (ai-notes/, a
 * FastAPI app) for transcription (faster-whisper) and summarization/action
 * items (a local LLM via Ollama) — no audio or transcript text leaves the
 * server. See ai-notes/README.md for how to run that service.
 */
export async function processRecording(audioBuffer: Buffer): Promise<AiNotesResult> {
  const serviceUrl = process.env.AI_NOTES_SERVICE_URL ?? 'http://127.0.0.1:8100';
  const serviceToken = process.env.AI_NOTES_SERVICE_TOKEN;

  const response = await fetch(`${serviceUrl}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      ...(serviceToken ? { 'X-Internal-Token': serviceToken } : {})
    },
    // TS's DOM BodyInit type doesn't accept Buffer directly even though
    // Node's fetch (undici) does at runtime — a Uint8Array backed by a
    // fresh ArrayBuffer (not the Buffer's ArrayBufferLike) satisfies it.
    body: new Uint8Array(audioBuffer)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ai-notes service returned ${response.status}${body ? `: ${body}` : ''}`);
  }

  return response.json();
}
