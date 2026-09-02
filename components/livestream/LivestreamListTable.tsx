import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface LivestreamListItem {
  id: string;
  title: string;
  status: string;
  createdByUserId: string;
  createdAt: Date;
  createdBy: { name: string };
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'muted'> = {
  SCHEDULED: 'neutral',
  LIVE: 'success',
  ENDED: 'muted'
};

export function LivestreamListTable({
  livestreams,
  currentUserId,
  emptyMessage
}: {
  livestreams: LivestreamListItem[];
  currentUserId: string;
  emptyMessage: string;
}) {
  if (livestreams.length === 0) {
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
          {livestreams.map((livestream) => {
            const isHost = livestream.createdByUserId === currentUserId;
            return (
              <tr key={livestream.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-foreground">{livestream.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{livestream.createdBy.name}</td>
                <td className="px-5 py-3">
                  <Badge variant={STATUS_VARIANT[livestream.status] ?? 'neutral'}>{livestream.status}</Badge>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(livestream.createdAt).toLocaleString()}</td>
                <td className="px-5 py-3 text-right">
                  {livestream.status === 'LIVE' ? (
                    <Link href={`/live/${livestream.id}`} className="text-sm text-primary hover:opacity-80">
                      Watch
                    </Link>
                  ) : livestream.status === 'SCHEDULED' && isHost ? (
                    <Link href={`/live/${livestream.id}`} className="text-sm text-primary hover:opacity-80">
                      Go live
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
