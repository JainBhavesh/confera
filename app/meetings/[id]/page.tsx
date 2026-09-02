import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireUserPage } from '@/lib/auth/guards';
import { getMeetingNotes } from '@/services/meetingNotes.service';
import { getResolvedPermissions, redactMeetingNotes } from '@/lib/permissions';
import { Card } from '@/components/ui/Card';
import { MeetingNotesCard } from '@/components/meeting/MeetingNotesCard';
import { GenerateNotesButton } from '@/components/meeting/GenerateNotesButton';
import { ParticipantsTable } from '@/components/meeting/ParticipantsTable';
import { ChatLog } from '@/components/meeting/ChatLog';

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserPage();
  const { id } = await params;

  const meeting = await prisma.meeting.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      participantSessions: { orderBy: { joinedAt: 'asc' }, include: { user: { select: { name: true } } } },
      messages: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } }
    }
  });
  if (!meeting) {
    notFound();
  }

  const rawNotes = await getMeetingNotes(meeting.id);
  const permissions = await getResolvedPermissions(user);
  const notes = rawNotes ? redactMeetingNotes(rawNotes, permissions) : null;

  const isHostOrAdmin = user.role === 'ADMIN' || meeting.createdByUserId === user.id;
  const canGenerateNotes = isHostOrAdmin && permissions.canGenerateNotes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">{meeting.title}</h1>
        <Link href="/meetings" className="text-sm text-primary hover:opacity-80">
          Back to meetings
        </Link>
      </div>

      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1 text-foreground">{meeting.status}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Ended</p>
          <p className="mt-1 text-foreground">{meeting.endedAt ? new Date(meeting.endedAt).toLocaleString() : '—'}</p>
        </div>
      </Card>

      <MeetingNotesCard
        notes={notes}
        meetingEnded={meeting.status === 'ENDED'}
        action={
          canGenerateNotes && meeting.status === 'ENDED' && notes?.status !== 'PENDING' ? (
            <GenerateNotesButton meetingId={meeting.id} hasNotes={notes?.status === 'READY'} />
          ) : undefined
        }
      />

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Participants</h2>
        <ParticipantsTable sessions={meeting.participantSessions} />
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Chat</h2>
        <ChatLog messages={meeting.messages} />
      </div>
    </div>
  );
}
