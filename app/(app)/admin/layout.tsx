import { ReactNode } from 'react';
import { requireAdminPage } from '@/lib/auth/guards';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();

  return <>{children}</>;
}
