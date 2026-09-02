'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export interface ActionItemItem {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  source: 'AI' | 'MANUAL';
  dueDate: string | null;
  assignedTo: { id: string; name: string } | null;
}

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export function ActionItemsTab({
  meetingId,
  items,
  canManage,
  currentUserId
}: {
  meetingId: string;
  items: ActionItemItem[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (id: string, status: string) => {
    setPendingId(id);
    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this action item?')) return;
    setPendingId(id);
    try {
      const response = await fetch(`/api/action-items/${id}`, { method: 'DELETE' });
      if (response.ok) router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    setError('');
    try {
      const response = await fetch('/api/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, title: newTitle.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to add action item.');
        return;
      }
      setNewTitle('');
      router.refresh();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage ? (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add an action item" maxLength={200} />
          <Button type="submit" disabled={adding || !newTitle.trim()}>
            {adding ? 'Adding...' : 'Add'}
          </Button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No action items yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const canChangeStatus = canManage || item.assignedTo?.id === currentUserId;
            return (
              <li key={item.id} className="rounded-2xl border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    <Badge variant={item.source === 'AI' ? 'neutral' : 'muted'}>{item.source}</Badge>
                    {item.assignedTo ? <span className="ml-2 text-xs text-muted-foreground">Assigned to {item.assignedTo.name}</span> : null}
                    {item.dueDate ? (
                      <span className="ml-2 text-xs text-muted-foreground">Due {new Date(item.dueDate).toLocaleDateString()}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      disabled={pendingId === item.id || !canChangeStatus}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={pendingId === item.id}
                        className="text-xs font-medium text-destructive hover:opacity-80"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
