'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RoomAudioRenderer,
  RoomContext,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  VideoTrack
} from '@livekit/components-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LeaveIcon } from '@/components/ui/icons/MeetingIcons';
import { ViewerCountBadge } from '@/components/livestream/ViewerCountBadge';
import { LivestreamChatPanel } from '@/components/livestream/LivestreamChatPanel';

interface LivestreamViewerClientProps {
  livestreamId: string;
  livestreamTitle: string;
  currentUserId: string | null;
}

export function LivestreamViewerClient({ livestreamId, livestreamTitle, currentUserId }: LivestreamViewerClientProps) {
  const router = useRouter();
  const isGuest = currentUserId === null;
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestName, setGuestName] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const guestSessionIdRef = useRef<string | null>(null);

  const readyToJoin = !isGuest || guestName !== null;
  const backHref = isGuest ? '/' : '/livestreams';

  useEffect(() => {
    if (!readyToJoin) return;
    let cancelled = false;
    let activeRoom: Room | null = null;

    (async () => {
      try {
        const response = await fetch(`/api/livestreams/${livestreamId}/join`, {
          method: 'POST',
          headers: isGuest ? { 'Content-Type': 'application/json' } : undefined,
          body: isGuest ? JSON.stringify({ guestName }) : undefined
        });
        const data = await response.json();

        if (!response.ok) {
          if (!cancelled) setError(data.error ?? 'Unable to join this livestream.');
          return;
        }

        if (data.isGuest && data.sessionId) {
          guestSessionIdRef.current = data.sessionId;
        }

        const newRoom = new Room();
        newRoom.on(RoomEvent.Disconnected, () => {
          if (!cancelled) setEnded(true);
        });
        await newRoom.connect(data.serverUrl, data.token, { autoSubscribe: true });

        if (cancelled) {
          await newRoom.disconnect();
          return;
        }

        activeRoom = newRoom;
        setRoom(newRoom);
      } catch (err) {
        console.error('[join] failed:', err);
        if (!cancelled) setError('Unable to join this livestream.');
      }
    })();

    return () => {
      cancelled = true;
      activeRoom?.disconnect();
    };
  }, [livestreamId, readyToJoin, isGuest, guestName]);

  // Best-effort: records a leave even if the tab is closed without clicking "Leave".
  useEffect(() => {
    if (!room) return;
    const notifyLeave = () => {
      const url = `/api/livestreams/${livestreamId}/leave`;
      if (isGuest && guestSessionIdRef.current) {
        const blob = new Blob([JSON.stringify({ sessionId: guestSessionIdRef.current })], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else if (!isGuest) {
        navigator.sendBeacon(url);
      }
    };
    window.addEventListener('pagehide', notifyLeave);
    return () => window.removeEventListener('pagehide', notifyLeave);
  }, [room, livestreamId, isGuest]);

  const handleGuestNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guestNameInput.trim();
    if (!trimmed) return;
    setGuestName(trimmed);
  };

  const handleLeave = () => {
    room?.disconnect();
    const body = isGuest && guestSessionIdRef.current ? JSON.stringify({ sessionId: guestSessionIdRef.current }) : undefined;
    fetch(`/api/livestreams/${livestreamId}/leave`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body
    }).catch(() => {});
    router.push(backHref);
  };

  if (!readyToJoin) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-sm p-8">
          <form onSubmit={handleGuestNameSubmit} className="space-y-5">
            <div>
              <h1 className="text-xl font-extrabold text-foreground">Watch &ldquo;{livestreamTitle}&rdquo;</h1>
              <p className="mt-2 text-sm text-muted-foreground">Enter your name to join the chat.</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Your name</label>
              <Input
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                required
                autoFocus
                maxLength={120}
                placeholder="e.g. Jordan Lee"
              />
            </div>
            <Button type="submit" disabled={!guestNameInput.trim()} className="w-full">
              Continue
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push(backHref)} className="mt-4">
          Back
        </Button>
      </Card>
    );
  }

  if (ended) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="text-muted-foreground">This livestream has ended.</p>
        <Button onClick={() => router.push(backHref)} className="mt-4">
          Back
        </Button>
      </Card>
    );
  }

  if (!room) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="text-muted-foreground">Connecting...</p>
      </Card>
    );
  }

  return (
    <RoomContext.Provider value={room}>
      <LiveViewerShell
        livestreamId={livestreamId}
        livestreamTitle={livestreamTitle}
        currentUserId={currentUserId}
        guestSessionId={guestSessionIdRef.current}
        onLeave={handleLeave}
      />
    </RoomContext.Provider>
  );
}

function LiveViewerShell({
  livestreamId,
  livestreamTitle,
  currentUserId,
  guestSessionId,
  onLeave
}: {
  livestreamId: string;
  livestreamTitle: string;
  currentUserId: string | null;
  guestSessionId: string | null;
  onLeave: () => void;
}) {
  const room = useRoomContext();
  const remoteParticipants = useRemoteParticipants();
  const cameraTracks = useTracks([Track.Source.Camera]);
  const hostTrack = cameraTracks[0];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#141312]">
      <RoomAudioRenderer />
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <div className="relative flex min-w-0 min-h-0 flex-1 flex-col p-3 sm:p-4">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#201e1d]">
            {hostTrack ? (
              <VideoTrack trackRef={hostTrack} playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-white/50">Waiting for the host to go live…</div>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-5 left-5 sm:bottom-6 sm:left-6">
            <div className="bg-[#141312]/85 px-3.5 py-2 text-white shadow-lg backdrop-blur">
              <p className="max-w-[40vw] truncate text-sm font-semibold sm:max-w-xs">{livestreamTitle}</p>
            </div>
          </div>
          <div className="pointer-events-none absolute right-5 top-5 sm:right-6 sm:top-6">
            <ViewerCountBadge count={Math.max(remoteParticipants.length, 0)} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center sm:bottom-6">
            <div className="pointer-events-auto flex items-center gap-3 bg-[#2d2b2b]/85 px-4 py-2 shadow-xl backdrop-blur">
              <button
                type="button"
                onClick={onLeave}
                aria-label="Leave"
                className="flex h-12 w-12 items-center justify-center bg-destructive text-destructive-foreground transition hover:opacity-90"
              >
                <LeaveIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-64 shrink-0 flex-col border-t border-white/14 bg-[#201e1d] sm:h-auto sm:w-64 sm:border-l sm:border-t-0 lg:w-[320px]">
          <LivestreamChatPanel room={room} livestreamId={livestreamId} currentUserId={currentUserId} guestSessionId={guestSessionId} />
        </div>
      </div>
    </div>
  );
}
