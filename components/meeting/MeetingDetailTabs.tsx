'use client';

import { useState } from 'react';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { MeetingNotesCard } from '@/components/meeting/MeetingNotesCard';
import { TranscriptTab } from '@/components/meeting/TranscriptTab';
import { ActionItemsTab, type ActionItemItem } from '@/components/meeting/ActionItemsTab';
import { RecordingPlayer } from '@/components/recording/RecordingPlayer';

export interface ParticipantSessionItem {
  id: string;
  joinedAt: Date;
  leftAt: Date | null;
  durationSeconds: number | null;
  user: { name: string } | null;
  guestName: string | null;
}

export interface MeetingDetailTabsProps {
  meetingId: string;
  currentUserId: string;
  participantSessions: ParticipantSessionItem[];
  notes: { status: 'PENDING' | 'READY' | 'FAILED' | 'SKIPPED'; summary: string | null } | null;
  transcript: string | null;
  translations: Record<string, string> | null;
  actionItems: ActionItemItem[];
  permissions: { canViewTranscript: boolean; canViewActionItems: boolean; canViewRecording: boolean };
  canManageActionItems: boolean;
  meetingEnded: boolean;
}

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'action-items', label: 'Action items' },
  { id: 'transcript', label: 'Transcript' }
];

function participantLabel(session: ParticipantSessionItem): string {
  return session.user?.name ?? session.guestName ?? 'Guest';
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'In progress';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

export function MeetingDetailTabs({
  meetingId,
  currentUserId,
  participantSessions,
  notes,
  transcript,
  translations,
  actionItems,
  permissions,
  canManageActionItems,
  meetingEnded
}: MeetingDetailTabsProps) {
  const [active, setActive] = useState('summary');
  const tabs = TABS.filter((t) => t.id !== 'action-items' || permissions.canViewActionItems).filter(
    (t) => t.id !== 'transcript' || permissions.canViewTranscript
  );

  return (
    <div className="grid grid-cols-[1fr_300px] gap-10 pt-6">
      <div>
        <Tabs tabs={tabs} active={active} onChange={setActive} />

        <TabPanel id="summary" active={active}>
          <div className="max-w-[680px]">
            <MeetingNotesCard notes={notes} meetingEnded={meetingEnded} bare />
          </div>
        </TabPanel>

        {permissions.canViewActionItems ? (
          <TabPanel id="action-items" active={active}>
            <div className="max-w-[680px]">
              <ActionItemsTab
                meetingId={meetingId}
                items={actionItems}
                canManage={canManageActionItems}
                currentUserId={currentUserId}
              />
            </div>
          </TabPanel>
        ) : null}

        {permissions.canViewTranscript ? (
          <TabPanel id="transcript" active={active}>
            <div className="max-w-[680px]">
              <TranscriptTab meetingId={meetingId} transcript={transcript} initialTranslations={translations} />
            </div>
          </TabPanel>
        ) : null}
      </div>

      <aside>
        {permissions.canViewRecording ? (
          <>
            <div className="mb-2.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Recording</div>
            {!meetingEnded ? (
              <p className="text-sm text-muted-foreground">The recording will be available once the meeting ends.</p>
            ) : (
              <div className="aspect-video bg-[#201e1d]">
                <RecordingPlayer endpoint={`/api/meetings/${meetingId}/recording`} mediaType="audio" bare />
              </div>
            )}
          </>
        ) : null}

        <div className="mb-2.5 mt-7 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Participants</div>
        {participantSessions.map((session) => (
          <div key={session.id} className="flex items-center gap-2.5 border-b border-divider py-2.5">
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center bg-muted font-heading text-[11px] font-extrabold text-foreground">
              {participantLabel(session)
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join('')}
            </div>
            <div className="flex-1 truncate text-[13px] text-foreground">
              {participantLabel(session)}
              {!session.user ? <span className="ml-1.5 text-muted-foreground">(guest)</span> : null}
            </div>
            <div className="text-xs text-muted-foreground">{formatDuration(session.durationSeconds)}</div>
          </div>
        ))}
      </aside>
    </div>
  );
}
