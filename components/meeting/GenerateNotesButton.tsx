'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function GenerateNotesButton({ meetingId, hasNotes }: { meetingId: string; hasNotes: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/meetings/${meetingId}/generate-notes`, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to generate notes.');
        return;
      }

      router.refresh();
    } catch {
      setError('Unable to generate notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleClick} disabled={loading} className="px-4 py-2 text-sm">
        {loading ? 'Starting…' : hasNotes ? 'Regenerate notes' : 'Generate notes'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
