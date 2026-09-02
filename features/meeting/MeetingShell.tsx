'use client';

import { useEffect, useState } from 'react';
import { RoomAudioRenderer, RoomContext, useConnectionState, useParticipants, useTrackToggle } from '@livekit/components-react';
import { ConnectionState, Room, RoomEvent, Track, type Participant } from 'livekit-client';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from '@/components/ui/icons/MediaIcons';
import { ChatIcon, LeaveIcon, ScreenShareIcon, ShareIcon, SignalIcon, UsersIcon } from '@/components/ui/icons/MeetingIcons';
import { Tooltip } from '@/components/ui/Tooltip';
import { LiveParticipantTile } from './LiveParticipantTile';
import { ParticipantGrid } from './ParticipantGrid';
import { PaginationControls } from './PaginationControls';
import { ScreenShareSpotlight } from './ScreenShareSpotlight';
import { useParticipantPagination } from './useParticipantPagination';
import { useResponsiveMaxCols } from './useResponsiveMaxCols';

interface MeetingShellProps {
  room: Room;
  inviteUrl: string;
  meetingId: string;
  meetingTitle: string;
  currentUserId: string;
  isGuest: boolean;
  isHost: boolean;
  onLeave: () => void;
}

type SidePanel = 'participants' | 'chat' | null;
type TrackSourceName = 'camera' | 'microphone';

function getParticipantDisplayName(participant: { name?: string; identity?: string }) {
  return participant.name || participant.identity || 'Guest';
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

// Toolbar controls stay on fixed dark chips regardless of the app's light/dark
// theme — the same convention Zoom/Meet/Teams use for call controls, since
// they sit over varied video content and need reliable icon contrast either way.
function ToolbarButton({
  onClick,
  disabled,
  active,
  danger,
  label,
  children
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const tone = danger
    ? 'bg-rose-600 text-white hover:bg-rose-500'
    : active
      ? 'bg-sky-600 text-white hover:bg-sky-500'
      : 'bg-slate-800 text-white hover:bg-slate-700';

  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12 ${tone}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function ParticipantRow({
  participant,
  isExpanded,
  onToggleExpand,
  isHost,
  onModerate,
  pendingSource
}: {
  participant: Participant;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isHost: boolean;
  onModerate: (source: TrackSourceName, muted: boolean) => void;
  pendingSource: TrackSourceName | null;
}) {
  const hasAudio = [...participant.audioTrackPublications.values()].some((pub) => !pub.isMuted && pub.track != null);
  const hasVideo = [...participant.videoTrackPublications.values()].some(
    (pub) => pub.source === Track.Source.Camera && !pub.isMuted && pub.track != null
  );
  const displayName = getParticipantDisplayName(participant);
  const canModerate = isHost && !participant.isLocal;

  return (
    <div className={`overflow-hidden rounded-xl transition ${isExpanded ? 'bg-card' : ''}`}>
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-card"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold text-foreground">
            {getInitial(displayName)}
          </div>
          <span className="truncate text-sm text-foreground">{participant.isLocal ? 'You' : displayName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
          {hasAudio ? <MicIcon className="h-4 w-4" /> : <MicOffIcon className="h-4 w-4 text-destructive" />}
          {hasVideo ? <CameraIcon className="h-4 w-4" /> : <CameraOffIcon className="h-4 w-4 text-destructive" />}
        </div>
      </button>

      {isExpanded ? (
        <div className="space-y-2 px-3 pb-3">
          <div className="h-36 overflow-hidden rounded-lg">
            <LiveParticipantTile participant={participant} />
          </div>
          {canModerate ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onModerate('microphone', hasAudio)}
                disabled={pendingSource === 'microphone'}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 text-xs font-medium text-foreground transition hover:bg-border disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasAudio ? <MicOffIcon className="h-3.5 w-3.5" /> : <MicIcon className="h-3.5 w-3.5" />}
                {hasAudio ? 'Mute' : 'Unmute'}
              </button>
              <button
                type="button"
                onClick={() => onModerate('camera', hasVideo)}
                disabled={pendingSource === 'camera'}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 text-xs font-medium text-foreground transition hover:bg-border disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasVideo ? <CameraOffIcon className="h-3.5 w-3.5" /> : <CameraIcon className="h-3.5 w-3.5" />}
                {hasVideo ? 'Disable camera' : 'Enable camera'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MeetingShellContent({ room, inviteUrl, meetingId, meetingTitle, currentUserId, isGuest, isHost, onLeave }: MeetingShellProps) {
  const participants = useParticipants({ room });
  const [mediaError, setMediaError] = useState('');
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [copied, setCopied] = useState(false);
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const [moderating, setModerating] = useState<{ identity: string; source: TrackSourceName } | null>(null);

  const { toggle: toggleMic, enabled: micEnabled, pending: micPending } = useTrackToggle({ source: Track.Source.Microphone, room });
  const { toggle: toggleCam, enabled: camEnabled, pending: camPending } = useTrackToggle({ source: Track.Source.Camera, room });
  const { toggle: toggleScreen, enabled: screenEnabled, pending: screenPending } = useTrackToggle({ source: Track.Source.ScreenShare, room });

  const connectionState = useConnectionState(room);
  const [isRecording, setIsRecording] = useState(room.isRecording);

  useEffect(() => {
    setIsRecording(room.isRecording);
    const handleRecordingStatusChanged = (recording: boolean) => setIsRecording(recording);
    room.on(RoomEvent.RecordingStatusChanged, handleRecordingStatusChanged);
    return () => {
      room.off(RoomEvent.RecordingStatusChanged, handleRecordingStatusChanged);
    };
  }, [room]);

  const maxCols = useResponsiveMaxCols();
  // Only the current page's participants ever get an SDK-hook-backed tile
  // mounted (LiveParticipantTile), so a 2,000-person room never subscribes
  // to or renders more than PARTICIPANTS_PER_PAGE video tracks at once.
  const { page, totalPages, pageItems, nextPage, prevPage } = useParticipantPagination(participants);

  const handleToggle = async (toggle: () => unknown) => {
    try {
      setMediaError('');
      await toggle();
    } catch {
      setMediaError('Camera/mic access blocked. Make sure the page is loaded over HTTPS or from localhost.');
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModerate = async (identity: string, source: TrackSourceName, currentlyOn: boolean) => {
    setModerating({ identity, source });
    setMediaError('');
    try {
      const response = await fetch(`/api/meetings/${meetingId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, source, muted: currentlyOn })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMediaError(data.error ?? 'Unable to update that participant.');
      }
    } catch {
      setMediaError('Unable to update that participant. Try again.');
    } finally {
      setModerating(null);
    }
  };

  const participantCount = participants.length;
  const togglePanel = (panel: SidePanel) => setSidePanel((current) => (current === panel ? null : panel));
  const activePanel = isGuest && sidePanel === 'chat' ? null : sidePanel;
  const sharingParticipant = participants.find((p) => p.isScreenShareEnabled);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card dark:shadow-card-dark">
      <RoomAudioRenderer />

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <div className="relative flex min-w-0 min-h-0 flex-1 flex-col p-3 sm:p-4">
          <div className="min-h-0 flex-1">
            {sharingParticipant ? (
              <ScreenShareSpotlight sharer={sharingParticipant} filmstripParticipants={pageItems} />
            ) : (
              <ParticipantGrid
                items={pageItems}
                maxCols={maxCols}
                getKey={(participant) => participant.identity}
                renderTile={(participant) => <LiveParticipantTile participant={participant} />}
              />
            )}
          </div>

          {totalPages > 1 ? (
            <div className="pointer-events-none absolute inset-x-0 top-5 flex justify-center sm:top-6">
              <div className="pointer-events-auto">
                <PaginationControls page={page} totalPages={totalPages} onPrev={prevPage} onNext={nextPage} />
              </div>
            </div>
          ) : null}

          {/* Meeting title floats where the old header bar used to live, reclaiming that row for video. */}
          <div className="pointer-events-none absolute bottom-5 left-5 flex items-end gap-2 sm:bottom-6 sm:left-6">
            <div className="rounded-2xl bg-slate-950/80 px-3.5 py-2 text-white shadow-lg backdrop-blur">
              <p className="max-w-[40vw] truncate text-sm font-semibold sm:max-w-xs">{meetingTitle}</p>
              <p className="text-xs text-slate-300">
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </p>
            </div>
            {isRecording ? (
              <div className="flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-2 text-xs font-semibold text-rose-300 shadow-lg backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                REC
              </div>
            ) : null}
            {connectionState !== ConnectionState.Connected ? (
              <div className="flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-2 text-xs font-semibold text-amber-300 shadow-lg backdrop-blur">
                <SignalIcon className="h-3.5 w-3.5" />
                {connectionState === ConnectionState.Disconnected ? 'Disconnected' : 'Reconnecting…'}
              </div>
            ) : null}
          </div>

          {mediaError ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4 sm:bottom-28">
              <p className="pointer-events-auto rounded-full bg-slate-950/90 px-4 py-2 text-xs text-rose-300 shadow-lg">{mediaError}</p>
            </div>
          ) : null}

          {/* Call controls float over the video instead of sitting in their own docked bar. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center sm:bottom-6">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full bg-slate-950/85 px-3 py-2 shadow-xl backdrop-blur sm:gap-3 sm:px-4">
              <ToolbarButton
                onClick={() => handleToggle(toggleMic)}
                disabled={micPending}
                danger={!micEnabled}
                label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micEnabled ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleToggle(toggleCam)}
                disabled={camPending}
                danger={!camEnabled}
                label={camEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {camEnabled ? <CameraIcon className="h-5 w-5" /> : <CameraOffIcon className="h-5 w-5" />}
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleToggle(toggleScreen)}
                disabled={screenPending}
                active={screenEnabled}
                label={screenEnabled ? 'Stop sharing screen' : 'Share screen'}
              >
                <ScreenShareIcon className="h-5 w-5" />
              </ToolbarButton>
              <span className="mx-1 h-8 w-px bg-white/15" />
              <ToolbarButton
                onClick={() => togglePanel('participants')}
                active={activePanel === 'participants'}
                label="Toggle participants panel"
              >
                <UsersIcon className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-950 px-1 text-[11px] font-semibold text-white ring-2 ring-slate-950">
                  {participantCount}
                </span>
              </ToolbarButton>
              {!isGuest ? (
                <ToolbarButton onClick={() => togglePanel('chat')} active={activePanel === 'chat'} label="Toggle chat panel">
                  <ChatIcon className="h-5 w-5" />
                </ToolbarButton>
              ) : null}
              <span className="mx-1 h-8 w-px bg-white/15" />
              <ToolbarButton onClick={handleCopyInvite} label={copied ? 'Copied!' : 'Copy invite link'}>
                <ShareIcon className="h-5 w-5" />
              </ToolbarButton>
              <ToolbarButton onClick={onLeave} danger label="Leave">
                <LeaveIcon className="h-5 w-5" />
              </ToolbarButton>
            </div>
          </div>
        </div>

        {activePanel ? (
          <div className="flex h-64 shrink-0 flex-col border-t border-border bg-muted sm:h-auto sm:w-64 sm:border-l sm:border-t-0 lg:w-[320px]">
            <div className="flex shrink-0 border-b border-border">
              <button
                type="button"
                onClick={() => setSidePanel('participants')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activePanel === 'participants' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Participants ({participantCount})
              </button>
              {!isGuest ? (
                <button
                  type="button"
                  onClick={() => setSidePanel('chat')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    activePanel === 'chat' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Chat
                </button>
              ) : null}
            </div>

            {activePanel === 'chat' ? (
              <ChatPanel room={room} meetingId={meetingId} currentUserId={currentUserId} />
            ) : (
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
                {participants.map((participant) => (
                  <ParticipantRow
                    key={participant.identity}
                    participant={participant}
                    isExpanded={expandedIdentity === participant.identity}
                    onToggleExpand={() =>
                      setExpandedIdentity((current) => (current === participant.identity ? null : participant.identity))
                    }
                    isHost={isHost}
                    pendingSource={moderating?.identity === participant.identity ? moderating.source : null}
                    onModerate={(source, currentlyOn) => handleModerate(participant.identity, source, currentlyOn)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MeetingShell({ room, inviteUrl, meetingId, meetingTitle, currentUserId, isGuest, isHost, onLeave }: MeetingShellProps) {
  return (
    <RoomContext.Provider value={room}>
      <MeetingShellContent
        room={room}
        inviteUrl={inviteUrl}
        meetingId={meetingId}
        meetingTitle={meetingTitle}
        currentUserId={currentUserId}
        isGuest={isGuest}
        isHost={isHost}
        onLeave={onLeave}
      />
    </RoomContext.Provider>
  );
}
