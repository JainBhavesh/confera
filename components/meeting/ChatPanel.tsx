'use client';

import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { Button } from '@/components/ui/Button';

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string };
}

const CHAT_TOPIC = 'chat';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function ChatPanel({ room, meetingId, currentUserId }: { room: Room; meetingId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/meetings/${meetingId}/messages`)
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
  }, [meetingId]);

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
      const response = await fetch(`/api/meetings/${meetingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (!response.ok) return;

      const { message } = (await response.json()) as { message: ChatMessage };
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
    <div className="flex h-full min-h-0 flex-col p-4">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-white/55">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.user.id === currentUserId;
            return (
              <div key={m.id} className="flex items-start gap-2.5 text-sm">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isMe ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'
                  }`}
                >
                  {getInitial(m.user.name)}
                </div>
                <p className="min-w-0 break-words">
                  <span className={`font-semibold ${isMe ? 'text-primary' : 'text-white'}`}>{isMe ? 'You' : m.user.name}</span>
                  <span className="ml-2 text-white/85">{m.message}</span>
                </p>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSend} className="mt-4 flex shrink-0 gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder="Message everyone"
          className="min-w-0 flex-1 border border-white/16 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
        />
        <Button type="submit" disabled={sending || !draft.trim()} className="px-4 py-2 text-sm">
          Send
        </Button>
      </form>
    </div>
  );
}
