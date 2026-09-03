import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireAdminPage } from '@/lib/auth/guards';
import { Badge } from '@/components/ui/Badge';

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'danger' | 'muted' | 'outline'> = {
  SCHEDULED: 'outline',
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
    <div>
      <h1 className="border-b-2 border-divider pb-5 text-[32px] font-extrabold text-foreground">All meetings</h1>

      {meetings.length === 0 ? (
        <p className="mt-6 border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No meetings yet in this organization.
        </p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-divider text-muted-foreground">
              <th className="py-3 pr-4 text-[11px] font-medium uppercase tracking-wide">Title</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Host</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Participants</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Created</th>
              <th className="py-3 pl-4" />
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting) => (
              <tr key={meeting.id} className="border-b border-divider last:border-0 hover:bg-muted/40">
                <td className="py-3 pr-4 font-semibold text-foreground">{meeting.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{meeting.createdBy.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[meeting.status] ?? 'neutral'}>{meeting.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{meeting._count.participantSessions}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(meeting.createdAt).toLocaleString()}</td>
                <td className="py-3 pl-4 text-right">
                  <Link href={`/admin/meetings/${meeting.id}`} className="text-sm text-primary hover:opacity-80">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
