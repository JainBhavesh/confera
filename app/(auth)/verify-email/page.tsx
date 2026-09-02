import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  const { email } = await searchParams;
  if (!email) {
    redirect('/register');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">One more step before you can start meeting.</p>
      </div>
      <VerifyEmailForm email={email} />
      <p className="text-sm text-muted-foreground">
        Wrong email?{' '}
        <Link href="/register" className="text-primary hover:opacity-80">
          Start over
        </Link>
      </p>
    </div>
  );
}
