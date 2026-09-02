import { Card } from '@/components/ui/Card';

export interface ParticipantSessionItem {
  id: string;
  joinedAt: Date;
  leftAt: Date | null;
  durationSeconds: number | null;
  user: { name: string } | null;
  guestName: string | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'In progress';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export function ParticipantsTable({ sessions }: { sessions: ParticipantSessionItem[] }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">User</th>
            <th className="px-5 py-3 font-medium">Joined</th>
            <th className="px-5 py-3 font-medium">Left</th>
            <th className="px-5 py-3 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                No participant sessions recorded.
              </td>
            </tr>
          ) : (
            sessions.map((session) => (
              <tr key={session.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-foreground">
                  {session.user?.name ?? session.guestName ?? 'Guest'}
                  {!session.user ? (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Guest</span>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(session.joinedAt).toLocaleTimeString()}</td>
                <td className="px-5 py-3 text-muted-foreground">{session.leftAt ? new Date(session.leftAt).toLocaleTimeString() : '—'}</td>
                <td className="px-5 py-3 text-muted-foreground">{formatDuration(session.durationSeconds)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
