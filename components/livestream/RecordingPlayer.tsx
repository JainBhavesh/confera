'use client';

import { useEffect, useState } from 'react';

type RecordingStatus = 'LOADING' | 'NONE' | 'RECORDING' | 'PROCESSING' | 'READY' | 'FAILED';

export function RecordingPlayer({ livestreamId }: { livestreamId: string }) {
  const [status, setStatus] = useState<RecordingStatus>('LOADING');
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      try {
        const response = await fetch(`/api/livestreams/${livestreamId}/recording`);
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
  }, [livestreamId]);

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

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Recording</h2>
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-black">
        <video controls className="w-full" src={url ?? undefined} />
      </div>
    </div>
  );
}
