'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const submitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      router.push(`/meet/${encodeURIComponent(joinId.trim())}`);
    }
  };

  const startMeeting = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New meeting' })
      });
      const data = await response.json();
      if (response.ok) {
        router.push(`/meet/${data.meeting.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b-2 border-divider bg-background px-8">
      <form onSubmit={submitSearch} className="relative max-w-[420px] flex-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="pointer-events-none absolute left-2.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 opacity-50"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search meetings, notes, transcripts"
          className="bg-transparent pl-8"
        />
      </form>

      <div className="ml-auto flex items-center gap-2.5">
        {joinOpen ? (
          <form onSubmit={submitJoin} className="flex items-center gap-2">
            <Input
              autoFocus
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Meeting ID"
              className="h-11 w-40"
            />
            <Button type="submit" variant="secondary" disabled={!joinId.trim()}>
              Join
            </Button>
          </form>
        ) : (
          <Button variant="secondary" onClick={() => setJoinOpen(true)}>
            Join with ID
          </Button>
        )}
        <Button onClick={startMeeting} disabled={creating}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[15px] w-[15px]">
            <path d="m16 10 5-3v10l-5-3z" />
            <rect x="3" y="6" width="13" height="12" />
          </svg>
          {creating ? 'Starting…' : 'New meeting'}
        </Button>
      </div>
    </div>
  );
}
