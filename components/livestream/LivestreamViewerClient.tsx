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
              <h1 className="text-xl font-semibold text-foreground">Watch &ldquo;{livestreamTitle}&rdquo;</h1>
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
    <div className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">{livestreamTitle}</h1>
          <Button onClick={onLeave} variant="dark-secondary">
            Leave
          </Button>
        </div>
        <div className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950">
          {hostTrack ? (
            <VideoTrack trackRef={hostTrack} playsInline className="h-full min-h-[360px] w-full object-cover" />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center bg-slate-900 text-slate-400">
              Waiting for the host to go live…
            </div>
          )}
          <div className="absolute right-4 top-4">
            <ViewerCountBadge count={Math.max(remoteParticipants.length, 0)} />
          </div>
        </div>
      </div>

      <div style={{ height: 480 }}>
        <LivestreamChatPanel room={room} livestreamId={livestreamId} currentUserId={currentUserId} guestSessionId={guestSessionId} />
      </div>

      <RoomAudioRenderer />
    </div>
  );
}
