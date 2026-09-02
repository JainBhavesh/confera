'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface AdminChatMessage {
  id: string;
  message: string;
  createdAt: string;
  senderName: string;
}

export function AdminChatLog({ livestreamId, messages }: { livestreamId: string; messages: AdminChatMessage[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (messageId: string) => {
    setDeletingId(messageId);
    try {
      const response = await fetch(`/api/livestreams/${livestreamId}/messages/${messageId}`, { method: 'DELETE' });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (messages.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">No messages were sent in this livestream.</Card>;
  }

  return (
    <Card className="max-h-96 space-y-3 overflow-y-auto p-6">
      {messages.map((m) => (
        <div key={m.id} className="flex items-start justify-between gap-3 text-sm">
          <div>
            <span className="font-semibold text-foreground">{m.senderName}</span>
            <span className="ml-2 text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()}</span>
            <p className="mt-1 text-muted-foreground">{m.message}</p>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(m.id)}
            disabled={deletingId === m.id}
            className="shrink-0 text-xs font-medium text-destructive hover:opacity-80"
          >
            {deletingId === m.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </Card>
  );
}
