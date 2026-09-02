import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface ActionItem {
  text: string;
  owner: string | null;
}

interface MeetingNotesLike {
  status: 'PENDING' | 'READY' | 'FAILED' | 'SKIPPED';
  transcript: string | null;
  summary: string | null;
  actionItems: unknown;
}

function parseActionItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ActionItem => typeof item === 'object' && item !== null && typeof (item as ActionItem).text === 'string'
  );
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

  const actionItems = parseActionItems(notes.actionItems);

  return (
    <Card className="space-y-5 p-6">
      <Header action={action} />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Summary</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{notes.summary}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Action items</p>
        {actionItems.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No action items identified.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                {item.text}
                {item.owner ? <span className="ml-2 text-muted-foreground">— {item.owner}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      {notes.transcript ? (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground group-open:text-foreground">Full transcript</summary>
          <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
            {notes.transcript}
          </p>
        </details>
      ) : null}
    </Card>
  );
}
