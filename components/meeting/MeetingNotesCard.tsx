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
  action,
  bare = false
}: {
  notes: MeetingNotesLike | null;
  meetingEnded: boolean;
  action?: ReactNode;
  bare?: boolean;
}) {
  const Wrapper = bare ? 'div' : Card;
  const wrapperProps = bare ? {} : { className: 'space-y-5 p-6' };

  if (!notes) {
    return (
      <Wrapper {...wrapperProps}>
        {!bare ? <Header action={meetingEnded ? action : undefined} /> : null}
        <p className="text-sm text-muted-foreground">
          {meetingEnded
            ? 'No notes yet — generate a summary and action items from this meeting’s recording.'
            : 'Notes can be generated once the meeting has ended.'}
        </p>
      </Wrapper>
    );
  }

  if (notes.status === 'PENDING') {
    return (
      <Wrapper {...wrapperProps}>
        {!bare ? <Header /> : null}
        <p className="text-sm text-muted-foreground">Transcribing and summarizing the recording — this can take a minute or two. Refresh to check.</p>
      </Wrapper>
    );
  }

  if (notes.status === 'SKIPPED') {
    return (
      <Wrapper {...wrapperProps}>
        {!bare ? <Header action={action} /> : null}
        <p className="text-sm text-muted-foreground">No recording was available to summarize for this meeting.</p>
      </Wrapper>
    );
  }

  if (notes.status === 'FAILED') {
    return (
      <Wrapper {...wrapperProps}>
        {!bare ? <Header action={action} /> : null}
        <p className="text-sm text-destructive">Notes couldn&apos;t be generated for this meeting. Try again.</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      {!bare ? <Header action={action} /> : null}
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{notes.summary}</p>
      {!bare ? <p className="text-xs text-muted-foreground">See the Transcript and Action Items tabs for the full detail.</p> : null}
    </Wrapper>
  );
}
