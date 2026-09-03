import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ForceEndLivestreamButton } from '@/components/livestream/ForceEndLivestreamButton';
import { ChatEnabledToggle } from '@/components/livestream/ChatEnabledToggle';
import { AdminChatLog } from '@/components/livestream/AdminChatLog';

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'muted'> = {
  SCHEDULED: 'neutral',
  LIVE: 'success',
  ENDED: 'muted'
};

export default async function AdminLivestreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;

  const livestream = await prisma.livestream.findFirst({
    where: { id, organizationId: admin.organizationId },
    include: { createdBy: { select: { name: true, email: true } } }
  });

  if (!livestream) {
    notFound();
  }

  const messages = await prisma.livestreamMessage.findMany({
    where: { livestreamId: livestream.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">{livestream.title}</h1>
        <Link href="/admin/livestreams" className="text-sm text-primary hover:opacity-80">
          Back to livestreams
        </Link>
      </div>

      <Card className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Host</p>
          <p className="mt-1 text-foreground">{livestream.createdBy.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1">
            <Badge variant={STATUS_VARIANT[livestream.status] ?? 'neutral'}>{livestream.status}</Badge>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Visibility</p>
          <p className="mt-1 text-foreground">
            {livestream.visibility === 'PUBLIC' ? 'Public — anyone with the link' : 'Private — org only'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Started</p>
          <p className="mt-1 text-foreground">{livestream.startedAt ? new Date(livestream.startedAt).toLocaleString() : '—'}</p>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Moderation</h2>
          <p className="text-sm text-muted-foreground">Manage chat and shut down the broadcast if needed.</p>
        </div>
        <div className="flex items-center gap-3">
          <ChatEnabledToggle livestreamId={livestream.id} initialEnabled={livestream.chatEnabled} />
          {livestream.status === 'LIVE' ? <ForceEndLivestreamButton livestreamId={livestream.id} /> : null}
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Chat</h2>
        <AdminChatLog
          livestreamId={livestream.id}
          messages={messages.map((m) => ({
            id: m.id,
            message: m.message,
            createdAt: m.createdAt.toISOString(),
            senderName: m.user?.name ?? m.guestName ?? 'Guest'
          }))}
        />
      </div>
    </div>
  );
}
