import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getOAuthErrorMessage } from '@/lib/auth/oauthErrors';
import { LoginForm } from '@/components/auth/LoginForm';
// Google/Facebook OAuth isn't configured yet — re-enable this import once it is.
// import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ redirectTo?: string; reset?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  const { redirectTo, reset, error } = await searchParams;
  const oauthError = getOAuthErrorMessage(error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Log in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Welcome back. Enter your credentials to continue.</p>
      </div>
      {reset === 'success' ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          Your password has been reset. Log in with your new password.
        </p>
      ) : null}
      {oauthError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{oauthError}</p>
      ) : null}
      {/* Google/Facebook OAuth isn't configured yet.
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      */}
      <LoginForm redirectTo={redirectTo} />
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:opacity-80">
          Register
        </Link>
      </p>
    </div>
  );
}
