import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface MeetingListItem {
  id: string;
  title: string;
  status: string;
  startedAt: Date | null;
  createdAt: Date;
  createdBy: { name: string };
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'danger' | 'muted'> = {
  SCHEDULED: 'neutral',
  LIVE: 'success',
  ENDED: 'muted',
  CANCELLED: 'danger'
};

export function MeetingListTable({ meetings, emptyMessage }: { meetings: MeetingListItem[]; emptyMessage: string }) {
  if (meetings.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Title</th>
            <th className="px-5 py-3 font-medium">Host</th>
            <th className="px-5 py-3 font-medium">Status</th>
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
              <td className="px-5 py-3 text-muted-foreground">{new Date(meeting.createdAt).toLocaleString()}</td>
              <td className="px-5 py-3 text-right">
                {meeting.status === 'LIVE' || meeting.status === 'SCHEDULED' ? (
                  <Link href={`/meet/${meeting.id}`} className="text-sm text-primary hover:opacity-80">
                    Join
                  </Link>
                ) : meeting.status === 'ENDED' ? (
                  <Link href={`/meetings/${meeting.id}`} className="text-sm text-primary hover:opacity-80">
                    Notes
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
