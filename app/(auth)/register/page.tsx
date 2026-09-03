import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getPublicOrganization } from '@/services/org.service';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  const organization = await getPublicOrganization();
  const registrationEnabled = Boolean(organization?.registrationEnabled);

  if (!registrationEnabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-[32px] font-extrabold text-foreground">Registration is disabled</h1>
        <p className="text-sm text-muted-foreground">
          Public registration is currently turned off. Ask an administrator to create an account for you.
        </p>
        <Link href="/login" className="inline-block text-primary hover:opacity-80">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold text-foreground">Create an account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Join {organization?.name ?? 'your organization'} to start meeting.</p>
      </div>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:opacity-80">
          Log in
        </Link>
      </p>
    </div>
  );
}
