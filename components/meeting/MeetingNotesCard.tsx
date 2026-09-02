import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface MeetingNotesLike {
  status: 'PENDING' | 'READY' | 'FAILED' | 'SKIPPED';
  summary: string | null;
}

function Header({ action }: { action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-foreground">AI meeting notes</h2>
      {action}
    </div>
  );
}

export function MeetingNotesCard({
  notes,
  meetingEnded,
  action
}: {
  notes: MeetingNotesLike | null;
  meetingEnded: boolean;
  action?: ReactNode;
}) {
  if (!notes) {
    return (
      <Card className="space-y-2 p-6">
        <Header action={meetingEnded ? action : undefined} />
        <p className="text-sm text-muted-foreground">
          {meetingEnded
            ? 'No notes yet — generate a summary and action items from this meeting’s recording.'
            : 'Notes can be generated once the meeting has ended.'}
        </p>
      </Card>
    );
  }

  if (notes.status === 'PENDING') {
    return (
      <Card className="space-y-2 p-6">
        <Header />
        <p className="text-sm text-muted-foreground">Transcribing and summarizing the recording — this can take a minute or two. Refresh to check.</p>
      </Card>
    );
  }

  if (notes.status === 'SKIPPED') {
    return (
      <Card className="space-y-2 p-6">
        <Header action={action} />
        <p className="text-sm text-muted-foreground">No recording was available to summarize for this meeting.</p>
      </Card>
    );
  }

  if (notes.status === 'FAILED') {
    return (
      <Card className="space-y-2 p-6">
        <Header action={action} />
        <p className="text-sm text-destructive">Notes couldn&apos;t be generated for this meeting. Try again.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-6">
      <Header action={action} />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Summary</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{notes.summary}</p>
      </div>
      <p className="text-xs text-muted-foreground">See the Transcript and Action Items tabs for the full detail.</p>
    </Card>
  );
}
