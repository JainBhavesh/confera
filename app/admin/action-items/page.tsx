import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { AdminActionItemsList } from '@/components/meeting/AdminActionItemsList';

export default async function AdminActionItemsPage() {
  const admin = await requireAdminPage();

  const actionItems = await prisma.actionItem.findMany({
    where: { organizationId: admin.organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      meeting: { select: { id: true, title: true } },
      assignedTo: { select: { id: true, name: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Action items</h1>
        <p className="mt-2 text-muted-foreground">Track and manage action items across every meeting in your organization.</p>
      </div>
      <AdminActionItemsList
        actionItems={actionItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          source: item.source,
          dueDate: item.dueDate ? item.dueDate.toISOString() : null,
          meeting: item.meeting,
          assignedTo: item.assignedTo
        }))}
      />
    </div>
  );
}
