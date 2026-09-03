'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function StartMeetingCard() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Give your meeting a title.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to create meeting.');
        return;
      }
      router.push(`/meet/${data.meeting.id}`);
    } catch {
      setError('Unable to create meeting. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-1.5 text-base font-extrabold text-foreground">Start a meeting</h4>
      <p className="mb-3.5 text-[13px] text-muted-foreground">Open a room now and send the link.</p>
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meeting title"
          className="min-w-[150px] flex-1"
        />
        <Button onClick={handleCreate} disabled={loading} className="shrink-0 whitespace-nowrap">
          {loading ? 'Starting…' : 'Start'}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
