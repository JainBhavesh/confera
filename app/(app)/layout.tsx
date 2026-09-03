import type { ReactNode } from 'react';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { toPublicUser } from '@/services/user.service';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUserPage();

  const openActionItemsCount = await prisma.actionItem.count({
    where: {
      organizationId: user.organizationId,
      assignedToUserId: user.id,
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    }
  });

  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr]">
      <Sidebar user={toPublicUser(user)} openActionItemsCount={openActionItemsCount} />
      <div className="min-w-0">
        <TopBar />
        <main className="px-8 pb-14 pt-9">{children}</main>
      </div>
    </div>
  );
}
