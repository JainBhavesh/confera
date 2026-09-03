'use client';

import { useEffect, useState } from 'react';

interface NotesState {
  status: 'PENDING' | 'READY' | 'FAILED' | 'SKIPPED';
  summary: string | null;
}

/**
 * Lives in the in-call side panel. There's no live-transcription pipeline —
 * notes are only generated once the meeting ends (see
 * services/meetingNotes.service.ts) — so this polls the same way
 * RecordingPlayer does and shows a placeholder until they exist.
 */
export function LiveNotesPanel({ meetingId }: { meetingId: string }) {
  const [notes, setNotes] = useState<NotesState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}/notes`);
        const data = await response.json();
        if (cancelled) return;
        setNotes(data.notes);
        setLoading(false);
        if (!data.notes || data.notes.status === 'PENDING') {
          timer = setTimeout(check, 8000);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [meetingId]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-2.5 text-[10px] uppercase tracking-[0.12em] text-white/45">Notes</div>
      {loading ? (
        <p className="text-sm text-white/55">Checking for notes…</p>
      ) : notes?.status === 'READY' && notes.summary ? (
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{notes.summary}</p>
      ) : (
        <p className="text-sm text-white/55">Notes appear here once the meeting ends and are summarized.</p>
      )}
    </div>
  );
}
