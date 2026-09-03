import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { CreateLivestreamForm } from '@/components/livestream/CreateLivestreamForm';
import { LivestreamListTable } from '@/components/livestream/LivestreamListTable';

export default async function LivestreamsPage() {
  const user = await requireUserPage();

  const livestreams = await prisma.livestream.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true } } }
  });

  return (
    <div>
      <div className="border-b-2 border-divider pb-5">
        <h1 className="mb-1.5 text-[32px] font-extrabold text-foreground">Livestreams</h1>
        <p className="text-sm text-muted-foreground">One host broadcasts, the whole organization watches.</p>
      </div>

      <div className="max-w-md py-6">
        <CreateLivestreamForm />
      </div>

      <LivestreamListTable
        livestreams={livestreams}
        currentUserId={user.id}
        emptyMessage="No livestreams yet — start one above."
      />
    </div>
  );
}
