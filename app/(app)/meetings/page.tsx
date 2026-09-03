import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { MeetingListTable } from '@/components/meeting/MeetingListTable';

export default async function MeetingHistoryPage() {
  const user = await requireUserPage();

  const meetings = await prisma.meeting.findMany({
    where: {
      organizationId: user.organizationId,
      OR: [{ createdByUserId: user.id }, { participantSessions: { some: { userId: user.id } } }]
    },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true } } }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">My meetings</h1>
      <MeetingListTable meetings={meetings} emptyMessage="You haven't created or joined any meetings yet." />
    </div>
  );
}
