import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { processRecording } from './aiNotes.client';

describe('processRecording', () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.AI_NOTES_SERVICE_URL;
  const originalToken = process.env.AI_NOTES_SERVICE_TOKEN;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.AI_NOTES_SERVICE_URL = originalUrl;
    process.env.AI_NOTES_SERVICE_TOKEN = originalToken;
  });

  it('posts the audio buffer and returns the parsed result', async () => {
    const result = { transcript: 'Hello.', summary: 'A greeting.', actionItems: [] };
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify(result), { status: 200 }));

    const response = await processRecording(Buffer.from('fake-audio'));

    expect(response).toEqual(result);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8100/process');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(init?.body as Uint8Array).toString()).toBe('fake-audio');
  });

  it('sends the X-Internal-Token header when AI_NOTES_SERVICE_TOKEN is set', async () => {
    process.env.AI_NOTES_SERVICE_TOKEN = 'secret123';
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ transcript: '', summary: '', actionItems: [] }), { status: 200 })
    );

    await processRecording(Buffer.from('fake-audio'));

    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>)['X-Internal-Token']).toBe('secret123');
  });

  it('throws with the response status and body on a non-OK response', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('bad audio', { status: 500 }));

    await expect(processRecording(Buffer.from('fake-audio'))).rejects.toThrow('ai-notes service returned 500: bad audio');
  });
});
