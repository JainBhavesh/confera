import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export interface AdminLivestreamListItem {
  id: string;
  title: string;
  status: string;
  visibility: string;
  chatEnabled: boolean;
  createdAt: Date;
  createdBy: { name: string };
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'muted' | 'outline'> = {
  SCHEDULED: 'outline',
  LIVE: 'success',
  ENDED: 'muted'
};

const VISIBILITY_VARIANT: Record<string, 'neutral' | 'success'> = {
  PRIVATE: 'neutral',
  PUBLIC: 'success'
};

export function AdminLivestreamListTable({ livestreams, emptyMessage }: { livestreams: AdminLivestreamListItem[]; emptyMessage: string }) {
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
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Visibility</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Chat</th>
          <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide">Created</th>
          <th className="py-3 pl-4" />
        </tr>
      </thead>
      <tbody>
        {livestreams.map((livestream) => (
          <tr key={livestream.id} className="border-b border-divider last:border-0 hover:bg-muted/40">
            <td className="py-3 pr-4 font-semibold text-foreground">{livestream.title}</td>
            <td className="px-4 py-3 text-muted-foreground">{livestream.createdBy.name}</td>
            <td className="px-4 py-3">
              <Badge variant={STATUS_VARIANT[livestream.status] ?? 'neutral'}>{livestream.status}</Badge>
            </td>
            <td className="px-4 py-3">
              <Badge variant={VISIBILITY_VARIANT[livestream.visibility] ?? 'neutral'}>{livestream.visibility}</Badge>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{livestream.chatEnabled ? 'Enabled' : 'Disabled'}</td>
            <td className="px-4 py-3 text-muted-foreground">{new Date(livestream.createdAt).toLocaleString()}</td>
            <td className="py-3 pl-4 text-right">
              <Link href={`/admin/livestreams/${livestream.id}`} className="text-sm text-primary hover:opacity-80">
                Manage
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
