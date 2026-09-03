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
    <div>
      <h1 className="border-b-2 border-divider pb-5 text-[32px] font-extrabold text-foreground">Meetings</h1>
      <div className="pt-4">
        <MeetingListTable meetings={meetings} emptyMessage="You haven't created or joined any meetings yet." />
      </div>
    </div>
  );
}
