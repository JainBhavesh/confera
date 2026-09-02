import { useIsSpeaking, useParticipantTracks, VideoTrack } from '@livekit/components-react';
import { Track, type Participant } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';

function getParticipantDisplayName(participant: { name?: string; identity?: string }): string {
  return participant.name || participant.identity || 'Guest';
}

/**
 * Bridges one live LiveKit participant into the SDK-agnostic ParticipantTile.
 * Mounted once per visible participant (only ever the current page's ≤12),
 * so its hooks — and the track subscriptions React Components' hooks imply —
 * only run for participants actually on screen, not the whole room.
 */
export function LiveParticipantTile({ participant }: { participant: Participant }) {
  const cameraTracks = useParticipantTracks([Track.Source.Camera], participant.identity);
  const screenTracks = useParticipantTracks([Track.Source.ScreenShare], participant.identity);
  // A track that's still published but server- or self-muted (e.g. a host
  // just disabled this participant's camera) shouldn't keep showing its last
  // frame — fall back to the avatar the same way "no track at all" does.
  const candidate = screenTracks[0] ?? cameraTracks[0];
  const track = candidate && !candidate.publication.isMuted ? candidate : undefined;
  const isSpeaking = useIsSpeaking(participant);
  const hasAudio = [...participant.audioTrackPublications.values()].some((pub) => !pub.isMuted && pub.track != null);

  return (
    <ParticipantTile
      name={getParticipantDisplayName(participant)}
      isLocal={participant.isLocal}
      isSpeaking={isSpeaking}
      hasAudio={hasAudio}
      renderVideo={
        track
          ? () => (
              <VideoTrack
                trackRef={track}
                muted={participant.isLocal}
                playsInline
                className="h-full w-full object-cover"
              />
            )
          : undefined
      }
    />
  );
}
