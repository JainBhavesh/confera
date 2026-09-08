'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';

const RECURRENCE_LABEL: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };

function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeParam(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function ScopeOption({ checked, onSelect, label }: { checked: boolean; onSelect: () => void; label: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex-1 border px-3 py-2.5 text-center text-[13px] transition ${
        checked ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-border text-foreground hover:bg-muted/60'
      }`}
    >
      {label}
    </button>
  );
}

export interface ScheduleMeetingItemData {
  id: string;
  title: string;
  scheduledAt: Date;
  recurrence: string;
  createdByName: string;
}

export function ScheduleMeetingItem({ meeting, canManage }: { meeting: ScheduleMeetingItemData; canManage: boolean }) {
  const router = useRouter();
  const isRecurring = meeting.recurrence !== 'ONCE';

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(() => toDateParam(meeting.scheduledAt));
  const [time, setTime] = useState(() => toTimeParam(meeting.scheduledAt));
  const [editScope, setEditScope] = useState<'single' | 'series'>('single');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<'single' | 'series'>('single');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const closeEdit = () => {
    setEditOpen(false);
    setTitle(meeting.title);
    setDate(toDateParam(meeting.scheduledAt));
    setTime(toTimeParam(meeting.scheduledAt));
    setEditScope('single');
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError('Fill in a title, date and time.');
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError('Enter a valid date and time.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), scheduledAt: scheduledAt.toISOString(), scope: editScope })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to update meeting.');
        return;
      }
      setEditOpen(false);
      router.refresh();
    } catch {
      setError('Unable to update meeting. Try again later.');
    } finally {
      setSaving(false);
    }
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setDeleteScope('single');
    setDeleteError('');
  };

  const handleDelete = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      const url =
        deleteScope === 'series' ? `/api/meetings/${meeting.id}?scope=series` : `/api/meetings/${meeting.id}`;
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setDeleteError(data.error ?? 'Unable to delete meeting.');
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setDeleteError('Unable to delete meeting. Try again later.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative mb-2 border-l-[3px] border-primary bg-muted px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>{meeting.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {meeting.recurrence !== 'ONCE' ? <span className="text-primary">· {RECURRENCE_LABEL[meeting.recurrence]}</span> : null}
      </div>
      <div className="text-[13px] font-semibold leading-tight text-foreground">{meeting.title}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{meeting.createdByName}</div>

      {canManage ? (
        <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
          <button
            type="button"
            aria-label="Edit meeting"
            onClick={() => setEditOpen(true)}
            className="flex h-6 w-6 items-center justify-center bg-card text-muted-foreground hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Delete meeting"
            onClick={() => setDeleteOpen(true)}
            className="flex h-6 w-6 items-center justify-center bg-card text-muted-foreground hover:text-destructive"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
            </svg>
          </button>
        </div>
      ) : null}

      <Dialog open={editOpen} onClose={closeEdit} title="Edit meeting">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={editScope === 'series'} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {isRecurring ? (
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground">Apply to</label>
              <div role="radiogroup" aria-label="Apply to" className="flex gap-1.5">
                <ScopeOption checked={editScope === 'single'} onSelect={() => setEditScope('single')} label="This" />
                <ScopeOption checked={editScope === 'series'} onSelect={() => setEditScope('series')} label="All" />
              </div>
              {editScope === 'series' ? (
                <p className="text-xs text-muted-foreground">
                  Title and time apply to every upcoming occurrence; each keeps its own date.
                </p>
              ) : null}
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeEdit}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={deleteOpen} onClose={closeDelete} title="Delete meeting">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">&ldquo;{meeting.title}&rdquo;</span>? This can&apos;t be
            undone.
          </p>
          {isRecurring ? (
            <div role="radiogroup" aria-label="Delete scope" className="flex gap-1.5">
              <ScopeOption checked={deleteScope === 'single'} onSelect={() => setDeleteScope('single')} label="This" />
              <ScopeOption checked={deleteScope === 'series'} onSelect={() => setDeleteScope('series')} label="All" />
            </div>
          ) : null}
          {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
