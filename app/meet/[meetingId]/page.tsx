import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getMeetingForGuestAccess, getOrgScopedMeeting, isMeetingHost } from '@/services/meeting.service';
import { MeetingRoomClient } from '@/components/meeting/MeetingRoomClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

function StatusCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
          <Link href="/">
            <Button>Back home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default async function MeetingPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const user = await getCurrentUser();

  if (user) {
    const meeting = await getOrgScopedMeeting(user.organizationId, meetingId);
    if (!meeting) {
      return <StatusCard title="Meeting not found" message="This meeting doesn't exist, or you don't have access to it." />;
    }

    return (
      <MeetingRoomClient
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        currentUserId={user.id}
        currentUserName={user.name}
        isGuest={false}
        isHost={isMeetingHost(meeting, user)}
      />
    );
  }

  // No session — only reachable at all if this meeting's org has opted into
  // public, link-only join (Admin → Settings → "Public meeting links").
  const record = await getMeetingForGuestAccess(meetingId);
  if (!record || !record.organization.publicMeetingsEnabled) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/meet/${meetingId}`)}`);
  }

  if (record.status === 'ENDED' || record.status === 'CANCELLED') {
    return <StatusCard title="This meeting has ended" message="Ask the host for a new invite link." />;
  }

  return (
    <MeetingRoomClient
      meetingId={record.id}
      meetingTitle={record.title}
      currentUserId={null}
      currentUserName={null}
      isGuest={true}
      isHost={false}
    />
  );
}
