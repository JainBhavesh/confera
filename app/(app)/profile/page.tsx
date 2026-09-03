import { requireUserPage } from '@/lib/auth/guards';
import { ProfileForms } from '@/components/auth/ProfileForms';

export default async function ProfilePage() {
  const user = await requireUserPage();
  return <ProfileForms initialName={user.name} email={user.email} />;
}
