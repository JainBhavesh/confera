import { ReactNode } from 'react';
import { requireAdminPage } from '@/lib/auth/guards';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1 space-y-6">{children}</div>
    </div>
  );
}
