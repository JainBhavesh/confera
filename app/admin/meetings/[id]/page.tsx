import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { getMeetingNotes } from '@/services/meetingNotes.service';
import { getResolvedPermissions } from '@/lib/permissions';
import { isMeetingHost } from '@/services/meeting.service';
import { MeetingDetailTabs } from '@/components/meeting/MeetingDetailTabs';

export default async function AdminMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;

  const meeting = await prisma.meeting.findFirst({
    where: { id, organizationId: admin.organizationId },
    include: {
      createdBy: { select: { name: true, email: true } },
      participantSessions: { orderBy: { joinedAt: 'asc' }, include: { user: { select: { name: true, email: true } } } },
      messages: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } }
    }
  });

  if (!meeting) {
    notFound();
  }

  const [rawNotes, actionItems, permissions] = await Promise.all([
    getMeetingNotes(meeting.id),
    prisma.actionItem.findMany({
      where: { meetingId: meeting.id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { id: true, name: true } } }
    }),
    getResolvedPermissions(admin)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">{meeting.title}</h1>
        <Link href="/admin/meetings" className="text-sm text-primary hover:opacity-80">
          Back to meetings
        </Link>
      </div>

      <MeetingDetailTabs
        meetingId={meeting.id}
        currentUserId={admin.id}
        overview={{
          hostName: meeting.createdBy.name,
          status: meeting.status,
          startedAt: meeting.startedAt ? meeting.startedAt.toISOString() : null,
          endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null
        }}
        participantSessions={meeting.participantSessions}
        messages={meeting.messages}
        notes={rawNotes ? { status: rawNotes.status, summary: rawNotes.summary } : null}
        transcript={permissions.canViewTranscript ? (rawNotes?.transcript ?? null) : null}
        translations={permissions.canViewTranscript ? ((rawNotes?.translations as Record<string, string> | null) ?? null) : null}
        actionItems={actionItems.map((item) => ({ ...item, dueDate: item.dueDate ? item.dueDate.toISOString() : null }))}
        permissions={permissions}
        canManageActionItems={isMeetingHost(meeting, admin)}
        meetingEnded={meeting.status === 'ENDED'}
      />
    </div>
  );
}
