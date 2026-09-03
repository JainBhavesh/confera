import type { Participant } from 'livekit-client';
import { LiveParticipantTile } from './LiveParticipantTile';

interface SpeakerSpotlightProps {
  spotlighted: Participant;
  /** Everyone else — shown as a filmstrip beneath the spotlighted participant. */
  filmstripParticipants: Participant[];
}

/**
 * "Speaker focus" layout variant — one participant fills the frame (whoever
 * is currently speaking, decided by the caller), with the rest as a
 * filmstrip row. Reuses LiveParticipantTile for both the spotlight and the
 * filmstrip, same as the gallery grid and screen-share spotlight, so it
 * never mounts more live video tracks than those do.
 */
export function SpeakerSpotlight({ spotlighted, filmstripParticipants }: SpeakerSpotlightProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="min-h-0 flex-1">
        <LiveParticipantTile participant={spotlighted} />
      </div>

      {filmstripParticipants.length > 0 ? (
        <div className="flex h-20 shrink-0 gap-2 overflow-x-auto sm:h-24">
          {filmstripParticipants.map((participant) => (
            <div key={participant.identity} className="h-full w-32 shrink-0">
              <LiveParticipantTile participant={participant} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
