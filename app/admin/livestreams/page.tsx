import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { CreateLivestreamForm } from '@/components/livestream/CreateLivestreamForm';
import { AdminLivestreamListTable } from '@/components/livestream/AdminLivestreamListTable';

export default async function AdminLivestreamsPage() {
  const admin = await requireAdminPage();

  const livestreams = await prisma.livestream.findMany({
    where: { organizationId: admin.organizationId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true } } }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Livestreams</h1>
        <p className="mt-2 text-muted-foreground">Moderate broadcasts across your organization.</p>
      </div>

      <CreateLivestreamForm />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">All livestreams</h2>
        <AdminLivestreamListTable livestreams={livestreams} emptyMessage="No livestreams yet." />
      </div>
    </div>
  );
}
