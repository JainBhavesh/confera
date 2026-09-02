'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PERMISSION_KEYS, PERMISSION_LABELS, toSettingsField, type PermissionMap } from '@/components/admin/permissionLabels';

export type DefaultPermissions = PermissionMap;

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

  const handleToggleRegistration = async () => {
    setError('');
    setLoading(true);
    const next = !registrationEnabled;

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationEnabled: next })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Unable to update settings.');
        return;
      }

      setRegistrationEnabled(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublicMeetings = async () => {
    setError('');
    setPublicMeetingsLoading(true);
    const next = !publicMeetingsEnabled;

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicMeetingsEnabled: next })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Unable to update settings.');
        return;
      }

      setPublicMeetingsEnabled(next);
      router.refresh();
    } finally {
      setPublicMeetingsLoading(false);
    }
  };

  const handleTogglePermission = async (key: keyof DefaultPermissions) => {
    setError('');
    setPendingPermission(key);
    const next = !permissions[key];

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [toSettingsField(key)]: next })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Unable to update settings.');
        return;
      }

      setPermissions((prev) => ({ ...prev, [key]: next }));
      router.refresh();
    } finally {
      setPendingPermission(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">Organization settings</h1>
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Organization</p>
        <p className="mt-1 text-lg text-foreground">{organizationName}</p>
      </Card>
      <Card className="flex items-center justify-between gap-4 p-6">
        <div>
          <p className="font-medium text-foreground">Public registration</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {registrationEnabled ? 'Anyone with the link can create an account.' : 'Only admins can create accounts.'}
          </p>
        </div>
        <Button onClick={handleToggleRegistration} disabled={loading} variant={registrationEnabled ? 'danger' : 'primary'}>
          {loading ? 'Saving...' : registrationEnabled ? 'Disable' : 'Enable'}
        </Button>
      </Card>

      <Card className="flex items-center justify-between gap-4 p-6">
        <div>
          <p className="font-medium text-foreground">Public meeting links</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {publicMeetingsEnabled
              ? 'Anyone with a meeting link can join as a guest, without an account.'
              : 'Only signed-in members of this organization can join meetings.'}
          </p>
        </div>
        <Button
          onClick={handleTogglePublicMeetings}
          disabled={publicMeetingsLoading}
          variant={publicMeetingsEnabled ? 'danger' : 'primary'}
        >
          {publicMeetingsLoading ? 'Saving...' : publicMeetingsEnabled ? 'Disable' : 'Enable'}
        </Button>
      </Card>

      <Card className="space-y-1 p-6">
        <p className="font-medium text-foreground">Default permissions</p>
        <p className="mb-4 text-sm text-muted-foreground">
          What every user can do by default. Override a specific person on the{' '}
          <a href="/admin/users" className="text-primary hover:opacity-80">
            Users
          </a>{' '}
          page.
        </p>
        <div className="divide-y divide-border">
          {PERMISSION_KEYS.map((key) => {
            const enabled = permissions[key];
            const label = PERMISSION_LABELS[key];
            return (
              <div
                key={key}
                data-testid={`default-permission-row-${key}`}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{label.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label.description}</p>
                </div>
                <Button
                  onClick={() => handleTogglePermission(key)}
                  disabled={pendingPermission === key}
                  variant={enabled ? 'secondary' : 'danger'}
                  className="px-4 py-2 text-sm"
                >
                  {pendingPermission === key ? 'Saving...' : enabled ? 'Allowed' : 'Blocked'}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
