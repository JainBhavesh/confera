'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';

const RECURRENCE_OPTIONS = [
  { value: 'ONCE', label: 'Once' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' }
] as const;

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

// Local (not UTC) date/time — matches how the day/time is entered and
// interpreted everywhere else on the Schedule screen.
function todayDateParam(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTimeParam(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ScheduleMeetingForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayDateParam);
  const [time, setTime] = useState(nowTimeParam);
  const [recurrence, setRecurrence] = useState<(typeof RECURRENCE_OPTIONS)[number]['value']>('ONCE');
  const [inviteEmailsRaw, setInviteEmailsRaw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => {
    setOpen(false);
    setTitle('');
    setDate(todayDateParam());
    setTime(nowTimeParam());
    setRecurrence('ONCE');
    setInviteEmailsRaw('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    const inviteEmails = parseEmails(inviteEmailsRaw);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = inviteEmails.find((email) => !emailPattern.test(email));
    if (invalidEmail) {
      setError(`"${invalidEmail}" doesn't look like a valid email.`);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          scheduledAt: scheduledAt.toISOString(),
          recurrence,
          inviteEmails
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Unable to schedule meeting.');
        return;
      }
      close();
      router.refresh();
    } catch {
      setError('Unable to schedule meeting. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>New scheduled meeting</Button>
      <Dialog open={open} onClose={close} title="Schedule a meeting">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">Repeats</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
              className="h-11 w-full border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {recurrence !== 'ONCE' ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              {recurrence === 'DAILY'
                ? 'Creates 14 daily occurrences starting from this date.'
                : recurrence === 'WEEKLY'
                  ? 'Creates 8 weekly occurrences starting from this date.'
                  : 'Creates 6 monthly occurrences starting from this date.'}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">Invite by email</label>
            <textarea
              value={inviteEmailsRaw}
              onChange={(e) => setInviteEmailsRaw(e.target.value)}
              placeholder="jane@example.com, sam@example.com"
              rows={2}
              className="w-full resize-none border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple addresses with commas. Anyone without a Confera account gets one created for them.
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling…' : 'Schedule'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
