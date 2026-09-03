'use client';

import { useEffect, useState } from 'react';

type RecordingStatus = 'LOADING' | 'NONE' | 'RECORDING' | 'PROCESSING' | 'READY' | 'FAILED';

/**
 * Polls a recording-status endpoint (meeting or livestream — they share the
 * same {status, url} shape) and renders whatever's appropriate for the
 * current state. `mediaType` picks <audio> vs <video> since meeting
 * recordings are audio-only OGG (Room Composite) while livestream recordings
 * are MP4 video (Track Composite) — see services/egress.service.ts.
 */
export function RecordingPlayer({
  endpoint,
  mediaType = 'video',
  bare = false
}: {
  endpoint: string;
  mediaType?: 'audio' | 'video';
  bare?: boolean;
}) {
  const [status, setStatus] = useState<RecordingStatus>('LOADING');
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (cancelled) return;

        setStatus(data.status);
        setUrl(data.url);

        if (data.status === 'PROCESSING' || data.status === 'RECORDING') {
          timer = setTimeout(check, 5000);
        }
      } catch {
        if (!cancelled) setStatus('FAILED');
      }
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [endpoint]);

  if (status === 'LOADING') {
    return <p className="text-sm text-muted-foreground">Checking for a recording…</p>;
  }

  if (status === 'NONE') {
    return null;
  }

  if (status === 'RECORDING' || status === 'PROCESSING') {
    return <p className="text-sm text-muted-foreground">The recording is still processing — check back shortly.</p>;
  }

  if (status === 'FAILED') {
    return <p className="text-sm text-destructive">The recording couldn&apos;t be processed.</p>;
  }

  const player =
    mediaType === 'audio' ? (
      <audio controls className="w-full p-4" src={url ?? undefined} />
    ) : (
      <video controls className="w-full" src={url ?? undefined} />
    );

  if (bare) {
    return <div className="bg-black">{player}</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Recording</h2>
      <div className="overflow-hidden border border-slate-800 bg-black">{player}</div>
    </div>
  );
}
