'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function DashboardActions() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [meetingId, setMeetingId] = useState('');
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

  const handleJoin = () => {
    if (meetingId.trim()) {
      router.push(`/meet/${encodeURIComponent(meetingId.trim())}`);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card className="grid gap-4 p-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Start a meeting</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create a new meeting and invite your team.</p>
        </div>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" />
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Start meeting'}
        </Button>
      </Card>

      <Card className="grid gap-4 p-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Join a meeting</h2>
          <p className="mt-2 text-sm text-muted-foreground">Paste a meeting ID or invite link to join.</p>
        </div>
        <Input value={meetingId} onChange={(e) => setMeetingId(e.target.value)} placeholder="Meeting ID" />
        <Button onClick={handleJoin} disabled={!meetingId.trim()} variant="secondary">
          Join meeting
        </Button>
      </Card>

      {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
    </div>
  );
}
