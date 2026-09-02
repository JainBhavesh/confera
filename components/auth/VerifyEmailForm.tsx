'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resend = async () => {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'EMAIL_VERIFICATION' })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to resend code.');
        return;
      }

      if (data.alreadyVerified) {
        router.push('/login');
        return;
      }

      setInfo('A new code has been sent.');
      startCooldown(data.cooldownSeconds ?? 60);
    } catch {
      setError('Unable to resend code. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to verify code.');
        return;
      }

      router.push(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
      router.refresh();
    } catch {
      setError('Unable to verify code. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below to
        verify your account.
      </p>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">6-digit code</label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
      <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
        {loading ? 'Verifying...' : 'Verify email'}
      </Button>
      <button
        type="button"
        onClick={resend}
        disabled={cooldown > 0 || loading}
        className="w-full text-center text-sm text-primary hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cooldown > 0 ? `Resend code (${cooldown}s)` : "Didn't get a code? Resend"}
      </button>
    </form>
  );
}
