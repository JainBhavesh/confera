'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from '@/components/ui/icons/MediaIcons';
import { createLiveKitConnection } from '@/livekit/livekitClient';
import { createLocalAudioTrack, createLocalVideoTrack, Room } from 'livekit-client';
import { MeetingShell } from '@/features/meeting/MeetingShell';

interface MeetingRoomClientProps {
  meetingId: string;
  meetingTitle: string;
  currentUserId: string | null;
  currentUserName: string | null;
  isGuest: boolean;
  isHost: boolean;
}

export function MeetingRoomClient({ meetingId, meetingTitle, currentUserId, currentUserName, isGuest, isHost }: MeetingRoomClientProps) {
  const router = useRouter();
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestName, setGuestName] = useState<string | null>(isGuest ? null : currentUserName);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectedRoom, setConnectedRoom] = useState<Room | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const guestSessionIdRef = useRef<string | null>(null);

  const displayName = guestName ?? currentUserName ?? 'Guest';
  const readyToShowLobby = !isGuest || guestName !== null;

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/meet/${meetingId}`);
  }, [meetingId]);

  useEffect(() => {
    if (!readyToShowLobby) return;
    let active = true;
    let capturedStream: MediaStream | null = null;

    const capturePreview = async () => {
      try {
        capturedStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          capturedStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setPreviewStream(capturedStream);
      } catch {
        setError('Unable to access camera or microphone. Please allow permissions.');
      }
    };

    capturePreview();

    return () => {
      active = false;
      capturedStream?.getTracks().forEach((t) => t.stop());
    };
  }, [readyToShowLobby]);

  useEffect(() => {
    if (previewRef.current && previewStream) {
      previewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  useEffect(() => {
    if (!previewStream) return;
    previewStream.getAudioTracks().forEach((t) => { t.enabled = audioEnabled; });
  }, [audioEnabled, previewStream]);

  useEffect(() => {
    if (!previewStream) return;
    previewStream.getVideoTracks().forEach((t) => { t.enabled = videoEnabled; });
  }, [videoEnabled, previewStream]);

  // Best-effort: records a leave even if the tab is closed without clicking "Leave".
  useEffect(() => {
    if (!connectedRoom) return;
    const notifyLeave = () => {
      const url = `/api/meetings/${meetingId}/leave`;
      if (isGuest && guestSessionIdRef.current) {
        const blob = new Blob([JSON.stringify({ sessionId: guestSessionIdRef.current })], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else if (!isGuest) {
        navigator.sendBeacon(url);
      }
    };
    window.addEventListener('pagehide', notifyLeave);
    return () => window.removeEventListener('pagehide', notifyLeave);
  }, [connectedRoom, meetingId, isGuest]);

  const handleGuestNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guestNameInput.trim();
    if (!trimmed) return;
    setGuestName(trimmed);
  };

  const handleJoin = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: isGuest ? { 'Content-Type': 'application/json' } : undefined,
        body: isGuest ? JSON.stringify({ guestName: displayName }) : undefined
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to join the meeting.');
        return;
      }

      if (data.isGuest && data.sessionId) {
        guestSessionIdRef.current = data.sessionId;
      }

      previewStream?.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);

      const room = await createLiveKitConnection(data.serverUrl, data.token);

      try {
        if (audioEnabled) {
          const audioTrack = await createLocalAudioTrack();
          await room.localParticipant.publishTrack(audioTrack);
        }
        if (videoEnabled) {
          const videoTrack = await createLocalVideoTrack();
          await room.localParticipant.publishTrack(videoTrack);
        }
      } catch {
        setJoinMessage('Joined without camera/mic — enable them from the meeting controls.');
      }

      setConnectedRoom(room);
      if (!joinMessage) setJoinMessage('You are now connected to the meeting.');
    } catch (err) {
      console.error('[join] failed:', err);
      setError('Unable to join the meeting. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    await connectedRoom?.disconnect();
    const body = isGuest && guestSessionIdRef.current ? JSON.stringify({ sessionId: guestSessionIdRef.current }) : undefined;
    fetch(`/api/meetings/${meetingId}/leave`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body
    }).catch(() => {});
    setConnectedRoom(null);
    router.push(isGuest ? '/' : '/dashboard');
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (connectedRoom) {
    return (
      <MeetingShell
        room={connectedRoom}
        inviteUrl={inviteUrl}
        meetingId={meetingId}
        meetingTitle={meetingTitle}
        currentUserId={currentUserId ?? displayName}
        isGuest={isGuest}
        isHost={isHost}
        onLeave={handleLeave}
      />
    );
  }

  if (!readyToShowLobby) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-sm p-8">
          <form onSubmit={handleGuestNameSubmit} className="space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Join &ldquo;{meetingTitle}&rdquo;</h1>
              <p className="mt-2 text-sm text-muted-foreground">Enter your name to continue as a guest.</p>
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

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Card className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-6">
        <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="relative min-h-[320px] flex-1 overflow-hidden border border-border bg-black">
              <video ref={previewRef} className="h-full w-full object-cover" autoPlay muted playsInline />

              {!videoEnabled ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-700 text-3xl font-semibold text-white">
                    {displayName.trim().charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
              ) : null}

              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3">
                <Tooltip label={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}>
                  <button
                    type="button"
                    onClick={() => setAudioEnabled((v) => !v)}
                    aria-label={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
                    aria-pressed={!audioEnabled}
                    className={`flex h-12 w-12 items-center justify-center transition ${
                      audioEnabled ? 'bg-[#2d2b2b] text-white hover:bg-[#3d3a3a]' : 'bg-destructive text-destructive-foreground hover:opacity-90'
                    }`}
                  >
                    {audioEnabled ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
                  </button>
                </Tooltip>
                <Tooltip label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}>
                  <button
                    type="button"
                    onClick={() => setVideoEnabled((v) => !v)}
                    aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    aria-pressed={!videoEnabled}
                    className={`flex h-12 w-12 items-center justify-center transition ${
                      videoEnabled ? 'bg-[#2d2b2b] text-white hover:bg-[#3d3a3a]' : 'bg-destructive text-destructive-foreground hover:opacity-90'
                    }`}
                  >
                    {videoEnabled ? <CameraIcon className="h-5 w-5" /> : <CameraOffIcon className="h-5 w-5" />}
                  </button>
                </Tooltip>
              </div>
            </div>

            {error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}
          </div>

          <div className="flex flex-col justify-center space-y-4 border border-border bg-card p-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Ready to join?</h2>
              <p className="mt-2 text-muted-foreground">
                {isGuest ? `Joining as ${displayName}.` : 'Connect to the room. Anyone with the invite link in your organization can join.'}
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleJoin} disabled={loading} className="w-full">
                {loading ? 'Joining...' : 'Join meeting'}
              </Button>
              <Button onClick={handleCopyInvite} variant="secondary" className="w-full">
                {copied ? 'Link copied!' : 'Copy invite link'}
              </Button>
            </div>
            {joinMessage ? <p className="text-sm text-foreground">{joinMessage}</p> : null}
          </div>
        </div>
      </Card>

      <div className="flex shrink-0 items-center justify-between gap-4 border border-border bg-card px-6 py-4 shadow-card">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">{meetingTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Meeting ID: <span className="break-all font-medium text-foreground">{meetingId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
