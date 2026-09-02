import Link from 'next/link';
import { Card } from '@/components/ui/Card';
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

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'muted'> = {
  SCHEDULED: 'neutral',
  LIVE: 'success',
  ENDED: 'muted'
};

const VISIBILITY_VARIANT: Record<string, 'neutral' | 'success'> = {
  PRIVATE: 'neutral',
  PUBLIC: 'success'
};

export function AdminLivestreamListTable({ livestreams, emptyMessage }: { livestreams: AdminLivestreamListItem[]; emptyMessage: string }) {
  if (livestreams.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</Card>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Title</th>
            <th className="px-5 py-3 font-medium">Host</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Visibility</th>
            <th className="px-5 py-3 font-medium">Chat</th>
            <th className="px-5 py-3 font-medium">Created</th>
            <th className="px-5 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {livestreams.map((livestream) => (
            <tr key={livestream.id} className="border-b border-border last:border-0">
              <td className="px-5 py-3 text-foreground">{livestream.title}</td>
              <td className="px-5 py-3 text-muted-foreground">{livestream.createdBy.name}</td>
              <td className="px-5 py-3">
                <Badge variant={STATUS_VARIANT[livestream.status] ?? 'neutral'}>{livestream.status}</Badge>
              </td>
              <td className="px-5 py-3">
                <Badge variant={VISIBILITY_VARIANT[livestream.visibility] ?? 'neutral'}>{livestream.visibility}</Badge>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{livestream.chatEnabled ? 'Enabled' : 'Disabled'}</td>
              <td className="px-5 py-3 text-muted-foreground">{new Date(livestream.createdAt).toLocaleString()}</td>
              <td className="px-5 py-3 text-right">
                <Link href={`/admin/livestreams/${livestream.id}`} className="text-sm text-primary hover:opacity-80">
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
