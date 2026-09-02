import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getLivestreamForGuestAccess, getOrgScopedLivestream } from '@/services/livestream.service';
import { LivestreamHostClient } from '@/components/livestream/LivestreamHostClient';
import { LivestreamViewerClient } from '@/components/livestream/LivestreamViewerClient';
import { RecordingPlayer } from '@/components/livestream/RecordingPlayer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function StatusCard({ title, message, backHref = '/livestreams' }: { title: string; message: string; backHref?: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
          <Link href={backHref}>
            <Button>Back</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function EndedCard({ title, livestreamId, backHref }: { title: string; livestreamId: string; backHref: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground">This livestream has ended.</p>
          <Link href={backHref}>
            <Button>Back</Button>
          </Link>
        </div>
      </Card>
      <RecordingPlayer livestreamId={livestreamId} />
    </div>
  );
}

export default async function LivestreamPage({ params }: { params: Promise<{ livestreamId: string }> }) {
  const { livestreamId } = await params;
  const user = await getCurrentUser();

  if (user) {
    const livestream = await getOrgScopedLivestream(user.organizationId, livestreamId);
    if (!livestream) {
      return <StatusCard title="Livestream not found" message="This livestream doesn't exist, or you don't have access to it." />;
    }

    const isHost = livestream.createdByUserId === user.id || user.role === 'ADMIN';

    if (livestream.status === 'ENDED') {
      return <EndedCard title={livestream.title} livestreamId={livestream.id} backHref="/livestreams" />;
    }

    if (!isHost && livestream.status === 'SCHEDULED') {
      return <StatusCard title={livestream.title} message="This livestream hasn't started yet. Check back soon." />;
    }

    if (isHost) {
      return <LivestreamHostClient livestreamId={livestream.id} livestreamTitle={livestream.title} currentUserId={user.id} />;
    }

    return <LivestreamViewerClient livestreamId={livestream.id} livestreamTitle={livestream.title} currentUserId={user.id} />;
  }

  // No session — only reachable at all when this specific livestream has
  // been made PUBLIC (per-livestream, not an org-wide toggle).
  const record = await getLivestreamForGuestAccess(livestreamId);
  if (!record || record.visibility !== 'PUBLIC') {
    redirect(`/login?redirectTo=${encodeURIComponent(`/live/${livestreamId}`)}`);
  }

  if (record.status === 'ENDED') {
    return <EndedCard title={record.title} livestreamId={record.id} backHref="/" />;
  }

  if (record.status === 'SCHEDULED') {
    return <StatusCard title={record.title} message="This livestream hasn't started yet. Check back soon." backHref="/" />;
  }

  return <LivestreamViewerClient livestreamId={record.id} livestreamTitle={record.title} currentUserId={null} />;
}
