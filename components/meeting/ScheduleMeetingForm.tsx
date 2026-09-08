'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';

const RECURRENCE_OPTIONS = [
  { value: 'ONCE', labelKey: 'once' },
  { value: 'DAILY', labelKey: 'daily' },
  { value: 'WEEKLY', labelKey: 'weekly' },
  { value: 'MONTHLY', labelKey: 'monthly' }
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
  const t = useTranslations('meeting.schedule');
  const tErrors = useTranslations('errors');
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
      setError(tErrors('fill_title_date_time'));
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError(tErrors('enter_valid_date_time'));
      return;
    }

    const inviteEmails = parseEmails(inviteEmailsRaw);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = inviteEmails.find((email) => !emailPattern.test(email));
    if (invalidEmail) {
      setError(tErrors('invalid_email', { email: invalidEmail }));
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
        setError(data.error ?? tErrors('unable_to_schedule_meeting'));
        return;
      }
      close();
      router.refresh();
    } catch {
      setError(tErrors('unable_to_schedule_meeting_retry'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('newButton')}</Button>
      <Dialog open={open} onClose={close} title={t('dialogTitle')}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">{t('titleLabel')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">{t('repeatsLabel')}</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
              className="h-11 w-full border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`recurrence.${opt.labelKey}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground">{t('dateLabel')}</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground">{t('timeLabel')}</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {recurrence !== 'ONCE' ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              {recurrence === 'DAILY'
                ? t('recurrenceHint.daily')
                : recurrence === 'WEEKLY'
                  ? t('recurrenceHint.weekly')
                  : t('recurrenceHint.monthly')}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">{t('inviteLabel')}</label>
            <textarea
              value={inviteEmailsRaw}
              onChange={(e) => setInviteEmailsRaw(e.target.value)}
              placeholder={t('invitePlaceholder')}
              rows={2}
              className="w-full resize-none border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">{t('inviteHint')}</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={close}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
