import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth/session';
import { getPublicOrganization } from '@/services/org.service';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  const organization = await getPublicOrganization();
  const registrationEnabled = Boolean(organization?.registrationEnabled);

  return (
    <Card className="mx-auto max-w-2xl p-10 text-center">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Confera</h1>
          <p className="mt-3 text-muted-foreground">Secure video meetings for your organization.</p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button>Log in</Button>
          </Link>
          {registrationEnabled ? (
            <Link href="/register">
              <Button variant="secondary">Create an account</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
