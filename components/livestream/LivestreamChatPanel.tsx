'use client';

import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { Button } from '@/components/ui/Button';

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  guestName: string | null;
}

const CHAT_TOPIC = 'chat';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function LivestreamChatPanel({
  room,
  livestreamId,
  currentUserId,
  guestSessionId
}: {
  room: Room;
  livestreamId: string;
  currentUserId: string | null;
  guestSessionId?: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  // Highlighting "You" can't rely on comparing a sender identity — guests
  // have no user id at all — so instead we remember the ids of messages this
  // client itself just sent, which works identically for members and guests.
  const sentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/livestreams/${livestreamId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [livestreamId]);

  useEffect(() => {
    const handleData = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== CHAT_TOPIC) return;
      try {
        const incoming = JSON.parse(decoder.decode(payload)) as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
      } catch {
        // ignore malformed payloads
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setDraft('');

    try {
      const response = await fetch(`/api/livestreams/${livestreamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: currentUserId === null ? guestSessionId ?? undefined : undefined })
      });
      if (!response.ok) return;

      const { message } = (await response.json()) as { message: ChatMessage };
      sentIdsRef.current.add(message.id);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));

      await room.localParticipant.publishData(encoder.encode(JSON.stringify(message)), {
        reliable: true,
        topic: CHAT_TOPIC
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-lg font-semibold text-white">Livestream chat</h3>
      <div ref={listRef} className="mt-4 flex-1 space-y-3 overflow-y-auto" style={{ maxHeight: 320 }}>
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isMine = sentIdsRef.current.has(m.id);
            const displayName = m.user?.name ?? m.guestName ?? 'Guest';
            return (
              <div key={m.id} className="text-sm">
                <span className={`font-semibold ${isMine ? 'text-sky-400' : 'text-slate-200'}`}>{isMine ? 'You' : displayName}</span>
                <span className="ml-2 break-words text-slate-300">{m.message}</span>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder="Message everyone"
          className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-sky-500"
        />
        <Button type="submit" disabled={sending || !draft.trim()} className="px-4 py-2 text-sm">
          Send
        </Button>
      </form>
    </div>
  );
}
