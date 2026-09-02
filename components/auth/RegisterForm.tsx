'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
// Google/Facebook OAuth isn't configured yet — re-enable this import once it is.
// import { OAuthButtons } from '@/components/auth/OAuthButtons';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function RegisterForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError('');
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setError('Profile picture must be a JPEG, PNG, WebP, or GIF image.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Profile picture must be smaller than 5MB.');
      e.target.value = '';
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('email', email);
      formData.set('password', password);
      if (avatarFile) formData.set('avatar', avatarFile);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to register.');
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      setError('Unable to register. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google/Facebook OAuth isn't configured yet.
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-muted-foreground">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted-foreground">Profile picture</label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs"
              >
                {avatarFile ? 'Change' : 'Upload'}
              </Button>
              {avatarFile ? (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">Optional. JPEG, PNG, WebP or GIF, up to 5MB.</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
