'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    return <p className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">No action items yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b-2 border-divider text-muted-foreground">
          <th className="py-3 pr-4 text-[11px] font-medium uppercase tracking-wide">Title</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Meeting</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Assignee</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Source</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Due</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Status</th>
          <th className="py-3 pl-4" />
        </tr>
      </thead>
      <tbody>
        {actionItems.map((item) => (
          <tr key={item.id} className="border-b border-divider last:border-0 hover:bg-muted/40">
            <td className="py-3 pr-4 font-semibold text-foreground">{item.title}</td>
            <td className="px-4 py-3 text-muted-foreground">
              <Link href={`/admin/meetings/${item.meeting.id}`} className="hover:text-primary">
                {item.meeting.title}
              </Link>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{item.assignedTo?.name ?? '—'}</td>
            <td className="px-4 py-3">
              <Badge variant={item.source === 'AI' ? 'neutral' : 'muted'}>{item.source}</Badge>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}</td>
            <td className="px-4 py-3">
              <select
                value={item.status}
                disabled={pendingId === item.id}
                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                className="border border-border bg-background px-2 py-1 text-xs text-foreground"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </td>
            <td className="py-3 pl-4 text-right">
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
  );
}
