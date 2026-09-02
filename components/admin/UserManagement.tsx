'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { PublicUser } from '@/services/user.service';
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey, type PermissionMap } from '@/components/admin/permissionLabels';

function generatePassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16);
}

export function UserManagement({
  initialUsers,
  currentUserId,
  defaultPermissions
}: {
  initialUsers: PublicUser[];
  currentUserId: string;
  defaultPermissions: PermissionMap;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [pendingPermission, setPendingPermission] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to create user.');
        return;
      }

      setCreatedCredentials({ email, password });
      setName('');
      setEmail('');
      setPassword(generatePassword());
      setShowForm(false);
      router.refresh();
    } catch {
      setError('Unable to create user. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: PublicUser) => {
    setPendingUserId(user.id);
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleTogglePermission = async (user: PublicUser, key: PermissionKey) => {
    const effective = user[key] ?? defaultPermissions[key];
    const pendingKey = `${user.id}:${key}`;
    setPendingPermission(pendingKey);
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !effective })
      });
      router.refresh();
    } finally {
      setPendingPermission(null);
    }
  };

  const handleResetPermission = async (user: PublicUser, key: PermissionKey) => {
    const pendingKey = `${user.id}:${key}`;
    setPendingPermission(pendingKey);
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: null })
      });
      router.refresh();
    } finally {
      setPendingPermission(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">Users</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Create user'}</Button>
      </div>

      {createdCredentials ? (
        <Card className="border-emerald-600/40 bg-emerald-500/10 p-5 dark:border-emerald-700 dark:bg-emerald-950/40">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
            Account created. Share this temporary password with {createdCredentials.email} — it will not be shown again.
          </p>
          <p className="mt-2 font-mono text-sm text-foreground">{createdCredentials.password}</p>
          <button
            onClick={() => setCreatedCredentials(null)}
            className="mt-3 text-xs text-emerald-700 hover:opacity-80 dark:text-emerald-300"
          >
            Dismiss
          </button>
        </Card>
      ) : null}

      {showForm ? (
        <Card className="p-6">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground">Temporary password</label>
              <div className="flex gap-2">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="font-mono"
                />
                <Button type="button" onClick={() => setPassword(generatePassword())} variant="secondary">
                  Regenerate
                </Button>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create user'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user) => {
              const isExpanded = expandedUserId === user.id;
              const isSelf = user.id === currentUserId;
              const isAdmin = user.role === 'ADMIN';
              return (
                <Fragment key={user.id}>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-foreground">{user.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant={user.isActive ? 'success' : 'muted'}>{user.isActive ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-4">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={pendingUserId === user.id}
                            className="text-sm text-primary hover:opacity-80 disabled:text-muted-foreground"
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {isAdmin ? null : (
                          <button
                            onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? 'Hide permissions' : 'Permissions'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && !isAdmin ? (
                    <tr className="border-b border-border bg-background/40 last:border-0">
                      <td colSpan={5} className="px-5 py-4">
                        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Permissions for {user.name}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {PERMISSION_KEYS.map((key) => {
                            const override = user[key];
                            const effective = override ?? defaultPermissions[key];
                            const isOverridden = override !== null;
                            const pendingKey = `${user.id}:${key}`;
                            const isPending = pendingPermission === pendingKey;
                            return (
                              <div
                                key={key}
                                data-testid={`permission-row-${key}`}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm text-foreground">{PERMISSION_LABELS[key].title}</p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {isOverridden ? 'Custom override' : 'Using org default'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isOverridden ? (
                                    <button
                                      onClick={() => handleResetPermission(user, key)}
                                      disabled={isPending}
                                      className="text-xs text-primary hover:opacity-80 disabled:text-muted-foreground"
                                    >
                                      Use default
                                    </button>
                                  ) : null}
                                  <Button
                                    onClick={() => handleTogglePermission(user, key)}
                                    disabled={isPending}
                                    variant={effective ? 'secondary' : 'danger'}
                                    className="px-3 py-1.5 text-xs"
                                  >
                                    {isPending ? 'Saving...' : effective ? 'Allowed' : 'Blocked'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
