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
    <div>
      <div className="border-b-2 border-divider pb-5">
        <h1 className="mb-1.5 text-[32px] font-extrabold text-foreground">All livestreams</h1>
        <p className="text-sm text-muted-foreground">Moderate broadcasts across your organization.</p>
      </div>

      <div className="max-w-md py-6">
        <CreateLivestreamForm />
      </div>

      <AdminLivestreamListTable livestreams={livestreams} emptyMessage="No livestreams yet." />
    </div>
  );
}
