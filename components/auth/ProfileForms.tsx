'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function ProfileForms({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [nameStatus, setNameStatus] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameStatus('');
    setNameLoading(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (response.ok) {
        setNameStatus('Saved.');
        router.refresh();
      } else {
        setNameStatus('Unable to save.');
      }
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordStatus('');
    setPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error ?? 'Unable to change password.');
        return;
      }

      setPasswordStatus('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">Profile</h1>

      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="mt-1 text-foreground">{email}</p>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="max-w-sm" />
          </div>
          <Button type="submit" disabled={nameLoading}>
            {nameLoading ? 'Saving...' : 'Save name'}
          </Button>
          {nameStatus ? <p className="text-sm text-muted-foreground">{nameStatus}</p> : null}
        </form>
      </Card>

      <Card className="p-6">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Change password</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">Current password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="max-w-sm"
            />
          </div>
          {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
          {passwordStatus ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{passwordStatus}</p> : null}
          <Button type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Saving...' : 'Change password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
