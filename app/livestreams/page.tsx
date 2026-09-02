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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Livestreams</h1>
        <p className="mt-2 text-muted-foreground">Start a broadcast or watch one that&apos;s live.</p>
      </div>

      <CreateLivestreamForm />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">All livestreams</h2>
        <LivestreamListTable
          livestreams={livestreams}
          currentUserId={user.id}
          emptyMessage="No livestreams yet — start one above."
        />
      </div>
    </div>
  );
}
