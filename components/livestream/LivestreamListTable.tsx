import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export interface LivestreamListItem {
  id: string;
  title: string;
  status: string;
  createdByUserId: string;
  createdAt: Date;
  createdBy: { name: string };
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'muted' | 'outline'> = {
  SCHEDULED: 'outline',
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
        {livestreams.map((livestream) => {
          const isHost = livestream.createdByUserId === currentUserId;
          return (
            <tr key={livestream.id} className="border-b border-divider last:border-0 hover:bg-muted/40">
              <td className="py-3 pr-4 font-semibold text-foreground">{livestream.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{livestream.createdBy.name}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[livestream.status] ?? 'neutral'}>{livestream.status}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(livestream.createdAt).toLocaleString()}</td>
              <td className="py-3 pl-4 text-right">
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
  );
}
