'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PERMISSION_KEYS, PERMISSION_LABELS, toSettingsField, type PermissionMap } from '@/components/admin/permissionLabels';

export type DefaultPermissions = PermissionMap;

function ToggleRow({
  title,
  description,
  on,
  pending,
  onToggle
}: {
  title: string;
  description: string;
  on: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-divider py-4 last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={on}
        className={`relative h-[22px] w-10 shrink-0 disabled:opacity-60 ${on ? 'bg-primary' : 'bg-border'}`}
      >
        <span className={`absolute top-[3px] h-4 w-4 bg-white transition-all ${on ? 'left-[19px]' : 'left-[3px]'}`} />
      </button>
    </div>
  );
}

export function SettingsForm({
  organizationName,
  initialRegistrationEnabled,
  initialPublicMeetingsEnabled,
  initialDefaultPermissions
}: {
  organizationName: string;
  initialRegistrationEnabled: boolean;
  initialPublicMeetingsEnabled: boolean;
  initialDefaultPermissions: DefaultPermissions;
}) {
  const router = useRouter();
  const [registrationEnabled, setRegistrationEnabled] = useState(initialRegistrationEnabled);
  const [publicMeetingsEnabled, setPublicMeetingsEnabled] = useState(initialPublicMeetingsEnabled);
  const [permissions, setPermissions] = useState(initialDefaultPermissions);
  const [loading, setLoading] = useState(false);
  const [publicMeetingsLoading, setPublicMeetingsLoading] = useState(false);
  const [pendingPermission, setPendingPermission] = useState<keyof DefaultPermissions | null>(null);
  const [error, setError] = useState('');

  const patchSetting = async (body: Record<string, boolean>) => {
    const response = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Unable to update settings.');
      return false;
    }
    router.refresh();
    return true;
  };

  const handleToggleRegistration = async () => {
    setError('');
    setLoading(true);
    const next = !registrationEnabled;
    try {
      if (await patchSetting({ registrationEnabled: next })) setRegistrationEnabled(next);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublicMeetings = async () => {
    setError('');
    setPublicMeetingsLoading(true);
    const next = !publicMeetingsEnabled;
    try {
      if (await patchSetting({ publicMeetingsEnabled: next })) setPublicMeetingsEnabled(next);
    } finally {
      setPublicMeetingsLoading(false);
    }
  };

  const handleTogglePermission = async (key: keyof DefaultPermissions) => {
    setError('');
    setPendingPermission(key);
    const next = !permissions[key];
    try {
      if (await patchSetting({ [toSettingsField(key)]: next })) setPermissions((prev) => ({ ...prev, [key]: next }));
    } finally {
      setPendingPermission(null);
    }
  };

  return (
    <div>
      <h1 className="border-b-2 border-divider pb-5 text-[32px] font-extrabold text-foreground">Organization settings</h1>

      <div className="grid grid-cols-[1fr_340px] gap-10 pt-7">
        <div>
          <div className="mb-2.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Access</div>
          <ToggleRow
            title="Public registration"
            description={registrationEnabled ? 'Anyone with the link can create an account.' : 'Only admins can create accounts.'}
            on={registrationEnabled}
            pending={loading}
            onToggle={handleToggleRegistration}
          />
          <ToggleRow
            title="Public meeting links"
            description={
              publicMeetingsEnabled
                ? 'Anyone with a meeting link can join as a guest, without an account.'
                : 'Only signed-in members of this organization can join meetings.'
            }
            on={publicMeetingsEnabled}
            pending={publicMeetingsLoading}
            onToggle={handleTogglePublicMeetings}
          />

          <div className="mb-2.5 mt-8 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Default permissions</div>
          <p className="mb-1 text-xs text-muted-foreground">
            What every user can do by default. Override a specific person on the{' '}
            <Link href="/admin/users" className="text-primary hover:opacity-80">
              Members
            </Link>{' '}
            page.
          </p>
          {PERMISSION_KEYS.map((key) => (
            <ToggleRow
              key={key}
              title={PERMISSION_LABELS[key].title}
              description={PERMISSION_LABELS[key].description}
              on={permissions[key]}
              pending={pendingPermission === key}
              onToggle={() => handleTogglePermission(key)}
            />
          ))}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </div>

        <div>
          <div className="mb-2.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Organization</div>
          <div className="border border-divider p-5">
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="mt-1 font-heading text-lg font-extrabold text-foreground">{organizationName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
