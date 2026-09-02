import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';

const wsUrl = process.env.LIVEKIT_WS_URL ?? '';
const apiKey = process.env.LIVEKIT_API_KEY ?? '';
const apiSecret = process.env.LIVEKIT_API_SECRET ?? '';

// RoomServiceClient uses HTTP, not WebSocket — convert ws(s):// → http(s)://
const httpUrl = wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');

function getRoomServiceClient() {
  if (!apiKey || !apiSecret || !wsUrl) {
    throw new Error('LiveKit API credentials are not configured.');
  }
  return new RoomServiceClient(httpUrl, apiKey, apiSecret);
}

/**
 * Mints a short-lived LiveKit token. Only ever called from server-side
 * authorization-checked code (meeting join route) — never expose the API
 * key/secret or a token-minting endpoint to unauthenticated clients.
 */
export async function mintMeetingToken(input: { roomName: string; identity: string; name: string }): Promise<string> {
  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API credentials are not configured.');
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: input.identity, name: input.name, ttl: '1h' });
  at.addGrant({ roomJoin: true, room: input.roomName, canPublish: true, canSubscribe: true, canPublishData: true });

  return at.toJwt();
}

export async function ensureRoomExists(roomName: string) {
  return getRoomServiceClient().createRoom({ name: roomName, emptyTimeout: 60 });
}

export class ParticipantTrackNotFoundError extends Error {}

/**
 * Server-forces a participant's published camera or microphone track muted
 * or unmuted — the moderation action behind a host's per-participant mic/
 * camera controls. Only mutes/unmutes a track that already exists; it can
 * never make a participant start publishing a track they haven't chosen to
 * (LiveKit has no "turn on someone's camera from nothing").
 */
export async function setParticipantTrackMuted(input: {
  roomName: string;
  identity: string;
  source: 'camera' | 'microphone';
  muted: boolean;
}): Promise<void> {
  const client = getRoomServiceClient();
  const participant = await client.getParticipant(input.roomName, input.identity);

  const wantedSource = input.source === 'camera' ? TrackSource.CAMERA : TrackSource.MICROPHONE;
  const track = participant.tracks.find((t) => t.source === wantedSource);
  if (!track) {
    throw new ParticipantTrackNotFoundError(`Participant ${input.identity} has no published ${input.source} track.`);
  }

  await client.mutePublishedTrack(input.roomName, input.identity, track.sid, input.muted);
}

/**
 * Mints a livestream token. Hosts can publish; viewers are subscribe-only
 * (still granted canPublishData so they can send chat over the data channel).
 */
export async function mintLivestreamToken(input: {
  roomName: string;
  identity: string;
  name: string;
  canPublish: boolean;
}): Promise<string> {
  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API credentials are not configured.');
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: input.identity, name: input.name, ttl: '6h' });
  at.addGrant({
    roomJoin: true,
    room: input.roomName,
    canPublish: input.canPublish,
    canSubscribe: true,
    canPublishData: true
  });

  return at.toJwt();
}
