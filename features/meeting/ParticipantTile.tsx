import { ReactNode } from 'react';
import { MicIcon, MicOffIcon } from '@/components/ui/icons/MediaIcons';

interface ParticipantTileProps {
  name: string;
  isLocal?: boolean;
  isSpeaking?: boolean;
  hasAudio: boolean;
  /** Renders the actual video surface (e.g. a LiveKit <VideoTrack>) when the participant has camera on. Omit to show the avatar placeholder. */
  renderVideo?: () => ReactNode;
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Presentational only — no LiveKit or any SDK dependency, so it works
 * identically for a real call and for mock/test data. Sized entirely by its
 * parent (ParticipantGrid gives it a flex-1 cell), which is what lets the
 * same component fill the whole screen for a 1-person page or shrink to a
 * 1/12th tile on a full page.
 */
export function ParticipantTile({ name, isLocal, isSpeaking, hasAudio, renderVideo }: ParticipantTileProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#201e1d] transition ${
        isSpeaking ? 'ring-4 ring-inset ring-primary/70' : ''
      }`}
    >
      {renderVideo ? (
        renderVideo()
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#2d2b2b]">
          <div className="flex h-[min(40%,96px)] w-[min(40%,96px)] items-center justify-center rounded-full bg-[#444141] text-2xl font-semibold text-white">
            {getInitial(name)}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1.5 bg-[#141312]/85 px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur sm:text-sm">
        {hasAudio ? <MicIcon className="h-3.5 w-3.5 shrink-0" /> : <MicOffIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />}
        <span className="truncate">{isLocal ? 'You' : name}</span>
      </div>
    </div>
  );
}
