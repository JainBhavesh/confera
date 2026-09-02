import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { getMeetingNotes } from '@/services/meetingNotes.service';
import { Card } from '@/components/ui/Card';
import { MeetingNotesCard } from '@/components/meeting/MeetingNotesCard';
import { GenerateNotesButton } from '@/components/meeting/GenerateNotesButton';
import { ParticipantsTable } from '@/components/meeting/ParticipantsTable';
import { ChatLog } from '@/components/meeting/ChatLog';

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

  const notes = await getMeetingNotes(meeting.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">{meeting.title}</h1>
        <Link href="/admin/meetings" className="text-sm text-primary hover:opacity-80">
          Back to meetings
        </Link>
      </div>

      <MeetingNotesCard
        notes={notes}
        meetingEnded={meeting.status === 'ENDED'}
        action={
          meeting.status === 'ENDED' && notes?.status !== 'PENDING' ? (
            <GenerateNotesButton meetingId={meeting.id} hasNotes={notes?.status === 'READY'} />
          ) : undefined
        }
      />

      <Card className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Host</p>
          <p className="mt-1 text-foreground">{meeting.createdBy.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1 text-foreground">{meeting.status}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Started</p>
          <p className="mt-1 text-foreground">{meeting.startedAt ? new Date(meeting.startedAt).toLocaleString() : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Ended</p>
          <p className="mt-1 text-foreground">{meeting.endedAt ? new Date(meeting.endedAt).toLocaleString() : '—'}</p>
        </div>
      </Card>

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
