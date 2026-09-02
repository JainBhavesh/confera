import { useParticipantTracks, VideoTrack } from '@livekit/components-react';
import { Track, type Participant } from 'livekit-client';
import { LiveParticipantTile } from './LiveParticipantTile';

function getParticipantDisplayName(participant: { name?: string; identity?: string }): string {
  return participant.name || participant.identity || 'Guest';
}

interface ScreenShareSpotlightProps {
  sharer: Participant;
  /** Everyone in the room (or the current page of them) — shown as a small filmstrip alongside the share. */
  filmstripParticipants: Participant[];
}

/**
 * Takes over the whole video area whenever anyone is screen-sharing — the
 * gallery grid isn't useful once there's a screen to actually look at. The
 * filmstrip sits in a column on the right rather than a row underneath, so
 * it doesn't eat into the share's vertical space. Reuses LiveParticipantTile
 * for the filmstrip, same as the grid does, so a screen share never renders
 * more tiles than a normal page would.
 */
export function ScreenShareSpotlight({ sharer, filmstripParticipants }: ScreenShareSpotlightProps) {
  const screenTracks = useParticipantTracks([Track.Source.ScreenShare], sharer.identity);
  const screenTrack = screenTracks[0];

  return (
    <div className="flex h-full min-h-0 gap-2">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-black">
        {screenTrack ? (
          <VideoTrack trackRef={screenTrack} playsInline className="h-full w-full object-contain" />
        ) : null}
        <div className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-1.5 text-sm text-slate-100 shadow-lg">
          {sharer.isLocal ? "You're presenting" : `${getParticipantDisplayName(sharer)} is presenting`}
        </div>
      </div>

      {filmstripParticipants.length > 0 ? (
        <div className="flex w-28 shrink-0 flex-col gap-2 overflow-y-auto sm:w-36">
          {filmstripParticipants.map((participant) => (
            <div key={participant.identity} className="h-20 w-full shrink-0 sm:h-24">
              <LiveParticipantTile participant={participant} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
