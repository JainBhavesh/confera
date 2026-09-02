'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface AdminActionItem {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  source: 'AI' | 'MANUAL';
  dueDate: string | null;
  meeting: { id: string; title: string };
  assignedTo: { id: string; name: string } | null;
}

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export function AdminActionItemsList({ actionItems }: { actionItems: AdminActionItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  if (actionItems.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">No action items yet.</Card>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Title</th>
            <th className="px-5 py-3 font-medium">Meeting</th>
            <th className="px-5 py-3 font-medium">Assignee</th>
            <th className="px-5 py-3 font-medium">Source</th>
            <th className="px-5 py-3 font-medium">Due</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0">
              <td className="px-5 py-3 text-foreground">{item.title}</td>
              <td className="px-5 py-3 text-muted-foreground">
                <Link href={`/admin/meetings/${item.meeting.id}`} className="hover:text-primary">
                  {item.meeting.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{item.assignedTo?.name ?? '—'}</td>
              <td className="px-5 py-3">
                <Badge variant={item.source === 'AI' ? 'neutral' : 'muted'}>{item.source}</Badge>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}</td>
              <td className="px-5 py-3">
                <select
                  value={item.status}
                  disabled={pendingId === item.id}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={pendingId === item.id}
                  className="text-xs font-medium text-destructive hover:opacity-80"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
