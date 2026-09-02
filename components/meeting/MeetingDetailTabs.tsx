'use client';

import { useState } from 'react';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { ParticipantsTable, type ParticipantSessionItem } from '@/components/meeting/ParticipantsTable';
import { ChatLog, type ChatLogMessageItem } from '@/components/meeting/ChatLog';
import { MeetingNotesCard } from '@/components/meeting/MeetingNotesCard';
import { GenerateNotesButton } from '@/components/meeting/GenerateNotesButton';
import { TranscriptTab } from '@/components/meeting/TranscriptTab';
import { ActionItemsTab, type ActionItemItem } from '@/components/meeting/ActionItemsTab';
import { RecordingPlayer } from '@/components/recording/RecordingPlayer';

export interface MeetingDetailTabsProps {
  meetingId: string;
  currentUserId: string;
  overview: { hostName: string; status: string; startedAt: string | null; endedAt: string | null };
  participantSessions: ParticipantSessionItem[];
  messages: ChatLogMessageItem[];
  notes: { status: 'PENDING' | 'READY' | 'FAILED' | 'SKIPPED'; summary: string | null } | null;
  transcript: string | null;
  translations: Record<string, string> | null;
  actionItems: ActionItemItem[];
  permissions: { canViewTranscript: boolean; canViewActionItems: boolean; canViewRecording: boolean; canGenerateNotes: boolean };
  canManageActionItems: boolean;
  meetingEnded: boolean;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'participants', label: 'Participants' },
  { id: 'chat', label: 'Chat' },
  { id: 'recording', label: 'Recording' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'notes', label: 'Notes' },
  { id: 'action-items', label: 'Action items' }
];

export function MeetingDetailTabs({
  meetingId,
  currentUserId,
  overview,
  participantSessions,
  messages,
  notes,
  transcript,
  translations,
  actionItems,
  permissions,
  canManageActionItems,
  meetingEnded
}: MeetingDetailTabsProps) {
  const [active, setActive] = useState('overview');

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <TabPanel id="overview" active={active}>
        <Card className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Host</p>
            <p className="mt-1 text-foreground">{overview.hostName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="mt-1 text-foreground">{overview.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="mt-1 text-foreground">{overview.startedAt ? new Date(overview.startedAt).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ended</p>
            <p className="mt-1 text-foreground">{overview.endedAt ? new Date(overview.endedAt).toLocaleString() : '—'}</p>
          </div>
        </Card>
      </TabPanel>

      <TabPanel id="participants" active={active}>
        <ParticipantsTable sessions={participantSessions} />
      </TabPanel>

      <TabPanel id="chat" active={active}>
        <ChatLog messages={messages} />
      </TabPanel>

      <TabPanel id="recording" active={active}>
        {!permissions.canViewRecording ? (
          <p className="text-sm text-muted-foreground">You do not have permission to view this meeting&apos;s recording.</p>
        ) : !meetingEnded ? (
          <p className="text-sm text-muted-foreground">The recording will be available once the meeting ends.</p>
        ) : (
          <RecordingPlayer endpoint={`/api/meetings/${meetingId}/recording`} mediaType="audio" />
        )}
      </TabPanel>

      <TabPanel id="transcript" active={active}>
        {!permissions.canViewTranscript ? (
          <p className="text-sm text-muted-foreground">You do not have permission to view this meeting&apos;s transcript.</p>
        ) : (
          <TranscriptTab meetingId={meetingId} transcript={transcript} initialTranslations={translations} />
        )}
      </TabPanel>

      <TabPanel id="notes" active={active}>
        <MeetingNotesCard
          notes={notes}
          meetingEnded={meetingEnded}
          action={
            permissions.canGenerateNotes && meetingEnded && notes?.status !== 'PENDING' ? (
              <GenerateNotesButton meetingId={meetingId} hasNotes={notes?.status === 'READY'} />
            ) : undefined
          }
        />
      </TabPanel>

      <TabPanel id="action-items" active={active}>
        {!permissions.canViewActionItems ? (
          <p className="text-sm text-muted-foreground">You do not have permission to view action items.</p>
        ) : (
          <ActionItemsTab meetingId={meetingId} items={actionItems} canManage={canManageActionItems} currentUserId={currentUserId} />
        )}
      </TabPanel>
    </div>
  );
}
