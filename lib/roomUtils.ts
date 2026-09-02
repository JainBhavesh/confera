import { randomBytes } from 'crypto';

/**
 * Non-guessable LiveKit room name per spec §7 — never a predictable name
 * like "room-1". The database (Meeting.id) remains the source of truth for
 * permissions; this is only the opaque name handed to LiveKit.
 */
export function generateLiveKitRoomName(organizationId: string): string {
  const random = randomBytes(12).toString('hex');
  return `org_${organizationId}_meeting_${random}`;
}

/** Same non-guessable-name rationale as generateLiveKitRoomName, for livestream rooms. */
export function generateLivestreamRoomName(organizationId: string): string {
  const random = randomBytes(12).toString('hex');
  return `org_${organizationId}_livestream_${random}`;
}
