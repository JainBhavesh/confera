'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Step = 'email' | 'reset';

export function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'PASSWORD_RESET' })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to send code.');
        return;
      }

      setStep('reset');
      setInfo(`If ${email} has an account, we sent it a 6-digit code. It expires in 10 minutes.`);
      startCooldown(data.cooldownSeconds ?? 60);
    } catch {
      setError('Unable to send code. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/otp/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to reset password.');
        return;
      }

      router.push('/login?reset=success');
    } catch {
      setError('Unable to reset password. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <form onSubmit={requestCode} className="space-y-5">
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending code...' : 'Send reset code'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-5">
      {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
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
          placeholder="At least 8 characters"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">Confirm new password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Re-enter new password"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
        {loading ? 'Resetting...' : 'Reset password'}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setCode('');
            setError('');
            setInfo('');
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
        <button
          type="button"
          onClick={() => requestCode()}
          disabled={cooldown > 0 || loading}
          className="text-primary hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
