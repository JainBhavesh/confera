import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold text-foreground">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a code to confirm it&apos;s you.
        </p>
      </div>
      <ResetPasswordForm />
      <p className="text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="text-primary hover:opacity-80">
          Log in
        </Link>
      </p>
    </div>
  );
}
