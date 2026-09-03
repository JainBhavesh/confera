import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'danger' | 'muted'> = {
  SCHEDULED: 'neutral',
  LIVE: 'success',
  ENDED: 'muted',
  CANCELLED: 'danger'
};

export default async function AdminMeetingsPage() {
  const admin = await requireAdminPage();

  const meetings = await prisma.meeting.findMany({
    where: { organizationId: admin.organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { participantSessions: true, messages: true } }
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">Meetings</h1>

      {meetings.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No meetings yet in this organization.</Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Host</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Participants</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-foreground">{meeting.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{meeting.createdBy.name}</td>
                  <td className="px-5 py-3">
                    <Badge variant={STATUS_VARIANT[meeting.status] ?? 'neutral'}>{meeting.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{meeting._count.participantSessions}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(meeting.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/meetings/${meeting.id}`} className="text-sm text-primary hover:opacity-80">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
