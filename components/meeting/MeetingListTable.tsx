import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export interface MeetingListItem {
  id: string;
  title: string;
  status: string;
  startedAt: Date | null;
  createdAt: Date;
  createdBy: { name: string };
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'danger' | 'muted' | 'outline'> = {
  SCHEDULED: 'outline',
  LIVE: 'success',
  ENDED: 'muted',
  CANCELLED: 'danger'
};

export function MeetingListTable({ meetings, emptyMessage }: { meetings: MeetingListItem[]; emptyMessage: string }) {
  if (meetings.length === 0) {
    return <p className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b-2 border-divider text-muted-foreground">
          <th className="py-3 pr-4 text-[11px] font-medium uppercase tracking-wide">Title</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Host</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Status</th>
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
            <td className="px-4 py-3 text-muted-foreground">{new Date(meeting.createdAt).toLocaleString()}</td>
            <td className="py-3 pl-4 text-right">
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
  );
}
