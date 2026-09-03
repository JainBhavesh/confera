'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Policy {
  key: 'defaultCanGenerateNotes' | 'publicMeetingsEnabled' | 'autoDeleteRecordingsAfterDays';
  label: string;
  description: string;
}

const POLICIES: Policy[] = [
  { key: 'defaultCanGenerateNotes', label: 'Auto-transcribe everything', description: 'Applies to all members.' },
  { key: 'publicMeetingsEnabled', label: 'Guests may join', description: 'External emails allowed by link.' },
  {
    key: 'autoDeleteRecordingsAfterDays',
    label: 'Delete recordings after 90 days',
    description: 'Notes and transcripts are kept.'
  }
];

export function OrgPolicyToggles({
  defaultCanGenerateNotes,
  publicMeetingsEnabled,
  autoDeleteRecordingsAfterDays
}: {
  defaultCanGenerateNotes: boolean;
  publicMeetingsEnabled: boolean;
  autoDeleteRecordingsAfterDays: number | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    defaultCanGenerateNotes,
    publicMeetingsEnabled,
    autoDeleteRecordingsAfterDays: autoDeleteRecordingsAfterDays !== null
  });
  const [pending, setPending] = useState<string | null>(null);

  const toggle = async (key: Policy['key']) => {
    const nextOn = !values[key === 'autoDeleteRecordingsAfterDays' ? 'autoDeleteRecordingsAfterDays' : key];
    setPending(key);
    setValues((prev) => ({ ...prev, [key]: nextOn }));

    const body = key === 'autoDeleteRecordingsAfterDays' ? { autoDeleteRecordingsAfterDays: nextOn ? 90 : null } : { [key]: nextOn };

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) router.refresh();
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <div className="mb-2.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Org policy</div>
      {POLICIES.map((policy) => {
        const on = values[policy.key === 'autoDeleteRecordingsAfterDays' ? 'autoDeleteRecordingsAfterDays' : policy.key];
        return (
          <div key={policy.key} className="flex items-start justify-between gap-4 border-b border-divider py-3.5">
            <div>
              <div className="text-sm font-semibold text-foreground">{policy.label}</div>
              <div className="text-xs text-muted-foreground">{policy.description}</div>
            </div>
            <button
              type="button"
              onClick={() => toggle(policy.key)}
              disabled={pending === policy.key}
              aria-pressed={on}
              className={`relative h-[22px] w-10 shrink-0 disabled:opacity-60 ${on ? 'bg-primary' : 'bg-border'}`}
            >
              <span
                className={`absolute top-[3px] h-4 w-4 bg-white transition-all ${on ? 'left-[19px]' : 'left-[3px]'}`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
