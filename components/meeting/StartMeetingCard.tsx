'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function StartMeetingCard() {
  const router = useRouter();
  const t = useTranslations('meeting.start');
  const tErrors = useTranslations('errors');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(tErrors('give_meeting_title'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? tErrors('unable_to_create_meeting'));
        return;
      }
      router.push(`/meet/${data.meeting.id}`);
    } catch {
      setError(tErrors('unable_to_create_meeting_retry'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-1.5 text-base font-extrabold text-foreground">{t('heading')}</h4>
      <p className="mb-3.5 text-[13px] text-muted-foreground">{t('description')}</p>
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          className="min-w-[150px] flex-1"
        />
        <Button onClick={handleCreate} disabled={loading} className="shrink-0 whitespace-nowrap">
          {loading ? t('starting') : t('startButton')}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
