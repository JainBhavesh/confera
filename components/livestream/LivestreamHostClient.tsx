'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RoomAudioRenderer,
  RoomContext,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTrackToggle
} from '@livekit/components-react';
import { createLocalAudioTrack, createLocalVideoTrack, Room, Track } from 'livekit-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ViewerCountBadge } from '@/components/livestream/ViewerCountBadge';
import { LivestreamChatPanel } from '@/components/livestream/LivestreamChatPanel';

interface LivestreamHostClientProps {
  livestreamId: string;
  livestreamTitle: string;
  currentUserId: string;
}

export function LivestreamHostClient({ livestreamId, livestreamTitle, currentUserId }: LivestreamHostClientProps) {
  const router = useRouter();
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [ending, setEnding] = useState(false);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [watchUrl, setWatchUrl] = useState('');

  useEffect(() => {
    setWatchUrl(`${window.location.origin}/live/${livestreamId}`);
  }, [livestreamId]);

  useEffect(() => {
    if (room) return; // once live, stop hogging the camera for the preview
    let active = true;
    let capturedStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        capturedStream = stream;
        setPreviewStream(stream);
      })
      .catch(() => setError('Unable to access camera or microphone. Please allow permissions.'));

    return () => {
      active = false;
      capturedStream?.getTracks().forEach((t) => t.stop());
    };
  }, [room]);

  useEffect(() => {
    if (previewRef.current && previewStream) {
      previewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const handleGoLive = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/livestreams/${livestreamId}/host-join`, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to go live.');
        return;
      }

      previewStream?.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);

      const newRoom = new Room();
      await newRoom.connect(data.serverUrl, data.token, { autoSubscribe: true });

      try {
        const audioTrack = await createLocalAudioTrack();
        const audioPub = await newRoom.localParticipant.publishTrack(audioTrack);
        const videoTrack = await createLocalVideoTrack();
        const videoPub = await newRoom.localParticipant.publishTrack(videoTrack);

        // Best effort — recording is a nice-to-have, not a reason to fail going live.
        fetch(`/api/livestreams/${livestreamId}/start-recording`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioTrackId: audioPub.trackSid, videoTrackId: videoPub.trackSid })
        }).catch(() => {});
      } catch {
        setError('Live, but camera/mic could not be published — check permissions.');
      }

      setRoom(newRoom);
    } catch (err) {
      console.error('[go-live] failed:', err);
      setError('Unable to go live. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    await room?.disconnect();
    // Awaited — the server call now also stops egress recording, so
    // navigating away before it resolves could show a stale "still live"
    // state on the very next page load.
    await fetch(`/api/livestreams/${livestreamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ENDED' })
    }).catch(() => {});
    setRoom(null);
    router.push('/livestreams');
  };

  const handleCopyLink = () => navigator.clipboard.writeText(watchUrl);

  return (
    <div className="grid gap-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{livestreamTitle}</h1>
            <p className="mt-2 text-slate-400">You&apos;re hosting this livestream.</p>
          </div>
          <Button onClick={handleCopyLink}>Copy watch link</Button>
        </div>
        <div className="mt-4 rounded-3xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-400 break-all">{watchUrl}</p>
        </div>
      </div>

      {room ? (
        <RoomContext.Provider value={room}>
          <LiveHostShell livestreamId={livestreamId} currentUserId={currentUserId} onEnd={handleEnd} ending={ending} />
        </RoomContext.Provider>
      ) : (
        <Card className="grid gap-6 p-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-slate-800 bg-black p-3">
              <video ref={previewRef} className="h-72 w-full rounded-3xl bg-slate-950 object-cover" autoPlay muted playsInline />
            </div>
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Ready to go live?</h2>
                <p className="mt-2 text-slate-400">Anyone in your organization will be able to watch once you start.</p>
              </div>
              <Button onClick={handleGoLive} disabled={loading} className="w-full">
                {loading ? 'Starting...' : 'Go live'}
              </Button>
            </div>
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </Card>
      )}
    </div>
  );
}

function LiveHostShell({
  livestreamId,
  currentUserId,
  onEnd,
  ending
}: {
  livestreamId: string;
  currentUserId: string;
  onEnd: () => void;
  ending: boolean;
}) {
  const room = useRoomContext();
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone, room });
  const { toggle: toggleCam, enabled: camEnabled } = useTrackToggle({ source: Track.Source.Camera, room });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950">
          {cameraTrack?.videoTrack ? (
            <video
              className="h-full min-h-[360px] w-full object-cover"
              autoPlay
              muted
              playsInline
              ref={(el) => {
                if (el && cameraTrack.videoTrack) cameraTrack.videoTrack.attach(el);
              }}
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center bg-slate-900 text-slate-400">Camera off</div>
          )}
          <div className="absolute right-4 top-4">
            <ViewerCountBadge count={remoteParticipants.length} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => toggleMic()} variant="dark-secondary">
            {micEnabled ? 'Mute mic' : 'Unmute mic'}
          </Button>
          <Button onClick={() => toggleCam()} variant="dark-secondary">
            {camEnabled ? 'Turn off camera' : 'Turn on camera'}
          </Button>
          <Button onClick={onEnd} disabled={ending} variant="dark-danger">
            {ending ? 'Ending...' : 'End livestream'}
          </Button>
        </div>
        <p className="text-xs text-slate-500">Publishing as {localParticipant.name ?? localParticipant.identity}</p>
      </div>

      <div style={{ height: 480 }}>
        <LivestreamChatPanel room={room} livestreamId={livestreamId} currentUserId={currentUserId} />
      </div>

      <RoomAudioRenderer />
    </div>
  );
}
