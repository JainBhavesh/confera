import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { getMeetingNotes } from '@/services/meetingNotes.service';
import { getResolvedPermissions } from '@/lib/permissions';
import { isMeetingHost } from '@/services/meeting.service';
import { MeetingDetailTabs } from '@/components/meeting/MeetingDetailTabs';
import { GenerateNotesButton } from '@/components/meeting/GenerateNotesButton';

function formatDuration(start: Date | null, end: Date | null): string | null {
  if (!start || !end) return null;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  return `${minutes} min`;
}

const RECURRENCE_LABEL: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };

function whenLabel(meeting: { startedAt: Date | null; scheduledAt: Date | null; createdAt: Date }): string {
  if (meeting.startedAt) return new Date(meeting.startedAt).toLocaleString();
  if (meeting.scheduledAt) return `Scheduled for ${new Date(meeting.scheduledAt).toLocaleString()}`;
  return new Date(meeting.createdAt).toLocaleString();
}

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserPage();
  const { id } = await params;

  const meeting = await prisma.meeting.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      participantSessions: { orderBy: { joinedAt: 'asc' }, include: { user: { select: { name: true } } } }
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
    getResolvedPermissions(user)
  ]);

  const meetingEnded = meeting.status === 'ENDED';
  const duration = formatDuration(meeting.startedAt, meeting.endedAt);

  return (
    <div>
      <Link href="/meetings" className="text-[13px] text-primary hover:opacity-80">
        ← Meetings
      </Link>
      <div className="mt-3 flex items-end justify-between gap-6 border-b-2 border-divider pb-4.5">
        <div>
          <h1 className="mb-2 text-[32px] font-extrabold text-foreground">{meeting.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
            <span>{whenLabel(meeting)}</span>
            {duration ? (
              <>
                <span>·</span>
                <span>{duration}</span>
              </>
            ) : null}
            <span>·</span>
            <span>{meeting.participantSessions.length} participants</span>
            <span>·</span>
            <span className="bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
              {meeting.status}
            </span>
            {meeting.recurrence !== 'ONCE' ? (
              <span className="border border-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {RECURRENCE_LABEL[meeting.recurrence]}
              </span>
            ) : null}
          </div>
        </div>
        {permissions.canGenerateNotes && meetingEnded && rawNotes?.status !== 'PENDING' ? (
          <GenerateNotesButton meetingId={meeting.id} hasNotes={rawNotes?.status === 'READY'} />
        ) : null}
      </div>

      <MeetingDetailTabs
        meetingId={meeting.id}
        currentUserId={user.id}
        participantSessions={meeting.participantSessions}
        notes={rawNotes ? { status: rawNotes.status, summary: rawNotes.summary } : null}
        transcript={permissions.canViewTranscript ? (rawNotes?.transcript ?? null) : null}
        translations={permissions.canViewTranscript ? ((rawNotes?.translations as Record<string, string> | null) ?? null) : null}
        actionItems={actionItems.map((item) => ({ ...item, dueDate: item.dueDate ? item.dueDate.toISOString() : null }))}
        permissions={permissions}
        canManageActionItems={isMeetingHost(meeting, user)}
        meetingEnded={meetingEnded}
      />
    </div>
  );
}
