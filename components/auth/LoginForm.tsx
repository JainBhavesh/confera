'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Stage = 'password' | 'otp-code';

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpOption, setShowOtpOption] = useState(false);
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

  const redirectAfterLogin = (role: string) => {
    const target = redirectTo || (role === 'ADMIN' ? '/admin' : '/dashboard');
    router.push(target);
    router.refresh();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-email?email=${encodeURIComponent(data.email ?? email)}`);
          return;
        }
        setError(data.error ?? 'Unable to log in.');
        setShowOtpOption(true);
        return;
      }

      redirectAfterLogin(data.user.role);
    } catch {
      setError('Unable to log in. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!email) {
      setError('Enter your email above first.');
      return;
    }

    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'LOGIN' })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to send code.');
        return;
      }

      setStage('otp-code');
      setInfo(`If ${email} has an account, we sent it a 6-digit code. It expires in 10 minutes.`);
      startCooldown(data.cooldownSeconds ?? 60);
    } catch {
      setError('Unable to send code. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to verify code.');
        return;
      }

      redirectAfterLogin(data.user.role);
    } catch {
      setError('Unable to verify code. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'otp-code') {
    return (
      <form onSubmit={verifyOtp} className="space-y-5">
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
            autoFocus
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
          {loading ? 'Verifying...' : 'Verify & log in'}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStage('password');
              setCode('');
              setError('');
              setInfo('');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Use password instead
          </button>
          <button
            type="button"
            onClick={requestOtp}
            disabled={cooldown > 0 || loading}
            className="text-primary hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
          placeholder="••••••••"
        />
        <div className="text-right">
          <Link href="/reset-password" className="text-sm text-primary hover:opacity-80">
            Forgot password?
          </Link>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
        {showOtpOption ? (
          <Button type="button" variant="secondary" disabled={loading} onClick={requestOtp} className="flex-1">
            Login with OTP
          </Button>
        ) : null}
      </div>
    </form>
  );
}
