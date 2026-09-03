import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { DashboardActions } from '@/components/meeting/DashboardActions';
import { MeetingListTable } from '@/components/meeting/MeetingListTable';

export default async function DashboardPage() {
  const user = await requireUserPage();

  const meetings = await prisma.meeting.findMany({
    where: {
      organizationId: user.organizationId,
      OR: [{ createdByUserId: user.id }, { participantSessions: { some: { userId: user.id } } }]
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { createdBy: { select: { name: true } } }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Welcome back, {user.name}</h1>
        <p className="mt-2 text-muted-foreground">Start a new meeting or join one that&apos;s already running.</p>
      </div>

      <DashboardActions />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent meetings</h2>
          <Link href="/meetings" className="text-sm text-primary hover:opacity-80">
            View all
          </Link>
        </div>
        <MeetingListTable meetings={meetings} emptyMessage="No meetings yet — start one above." />
      </div>
    </div>
  );
}
