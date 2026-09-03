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
import { MicIcon, MicOffIcon, CameraIcon, CameraOffIcon } from '@/components/ui/icons/MediaIcons';
import { LeaveIcon } from '@/components/ui/icons/MeetingIcons';
import { Tooltip } from '@/components/ui/Tooltip';
import { ViewerCountBadge } from '@/components/livestream/ViewerCountBadge';
import { LivestreamChatPanel } from '@/components/livestream/LivestreamChatPanel';

interface LivestreamHostClientProps {
  livestreamId: string;
  livestreamTitle: string;
  currentUserId: string;
}

function ToolbarButton({
  onClick,
  danger,
  label,
  children
}: {
  onClick: () => void;
  danger?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex h-12 w-12 items-center justify-center transition ${
          danger ? 'bg-destructive text-destructive-foreground hover:opacity-90' : 'bg-[#2d2b2b] text-white hover:bg-[#3d3a3a]'
        }`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function LivestreamHostClient({ livestreamId, livestreamTitle, currentUserId }: LivestreamHostClientProps) {
  const router = useRouter();
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [ending, setEnding] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [watchUrl, setWatchUrl] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(watchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (room) {
    return (
      <RoomContext.Provider value={room}>
        <LiveHostShell livestreamId={livestreamId} currentUserId={currentUserId} onEnd={handleEnd} ending={ending} />
      </RoomContext.Provider>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Card className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-6">
        <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="relative min-h-[320px] flex-1 overflow-hidden border border-border bg-black">
              <video ref={previewRef} className="h-full w-full object-cover" autoPlay muted playsInline />
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    previewStream?.getAudioTracks().forEach((t) => (t.enabled = !audioEnabled));
                    setAudioEnabled((v) => !v);
                  }}
                  aria-label={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
                  className={`flex h-12 w-12 items-center justify-center transition ${
                    audioEnabled ? 'bg-[#2d2b2b] text-white hover:bg-[#3d3a3a]' : 'bg-destructive text-destructive-foreground hover:opacity-90'
                  }`}
                >
                  {audioEnabled ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    previewStream?.getVideoTracks().forEach((t) => (t.enabled = !videoEnabled));
                    setVideoEnabled((v) => !v);
                  }}
                  aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  className={`flex h-12 w-12 items-center justify-center transition ${
                    videoEnabled ? 'bg-[#2d2b2b] text-white hover:bg-[#3d3a3a]' : 'bg-destructive text-destructive-foreground hover:opacity-90'
                  }`}
                >
                  {videoEnabled ? <CameraIcon className="h-5 w-5" /> : <CameraOffIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}
          </div>

          <div className="flex flex-col justify-center space-y-4 border border-border bg-card p-6">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Ready to go live?</h2>
              <p className="mt-2 text-muted-foreground">Anyone in your organization will be able to watch once you start.</p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleGoLive} disabled={loading} className="w-full">
                {loading ? 'Starting…' : 'Go live'}
              </Button>
              <Button onClick={handleCopyLink} variant="secondary" className="w-full">
                {copied ? 'Link copied!' : 'Copy watch link'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex shrink-0 items-center justify-between gap-4 border border-border bg-card px-6 py-4 shadow-card">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-foreground">{livestreamTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Watch link: <span className="break-all font-medium text-foreground">{watchUrl}</span>
          </p>
        </div>
      </div>
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
    <div className="flex h-full flex-col overflow-hidden bg-[#141312]">
      <RoomAudioRenderer />
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <div className="relative flex min-w-0 min-h-0 flex-1 flex-col p-3 sm:p-4">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#201e1d]">
            {cameraTrack?.videoTrack ? (
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                playsInline
                ref={(el) => {
                  if (el && cameraTrack.videoTrack) cameraTrack.videoTrack.attach(el);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/50">Camera off</div>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-5 left-5 flex items-end gap-2 sm:bottom-6 sm:left-6">
            <div className="flex items-center gap-1.5 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              LIVE
            </div>
            <p className="bg-[#141312]/85 px-3 py-2 text-xs text-white/70 shadow-lg backdrop-blur">
              Publishing as {localParticipant.name ?? localParticipant.identity}
            </p>
          </div>
          <div className="pointer-events-none absolute right-5 top-5 sm:right-6 sm:top-6">
            <ViewerCountBadge count={remoteParticipants.length} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center sm:bottom-6">
            <div className="pointer-events-auto flex items-center gap-3 bg-[#2d2b2b]/85 px-4 py-2 shadow-xl backdrop-blur">
              <ToolbarButton onClick={() => toggleMic()} danger={!micEnabled} label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}>
                {micEnabled ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
              </ToolbarButton>
              <ToolbarButton onClick={() => toggleCam()} danger={!camEnabled} label={camEnabled ? 'Turn off camera' : 'Turn on camera'}>
                {camEnabled ? <CameraIcon className="h-5 w-5" /> : <CameraOffIcon className="h-5 w-5" />}
              </ToolbarButton>
              <span className="mx-1 h-8 w-px bg-white/15" />
              <ToolbarButton onClick={onEnd} danger label={ending ? 'Ending…' : 'End livestream'}>
                <LeaveIcon className="h-5 w-5" />
              </ToolbarButton>
            </div>
          </div>
        </div>

        <div className="flex h-64 shrink-0 flex-col border-t border-white/14 bg-[#201e1d] sm:h-auto sm:w-64 sm:border-l sm:border-t-0 lg:w-[320px]">
          <LivestreamChatPanel room={room} livestreamId={livestreamId} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
