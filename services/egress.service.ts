import { EgressClient, EncodedFileOutput, EncodedFileType, EgressStatus } from 'livekit-server-sdk';
import type { Livestream, Meeting } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const wsUrl = process.env.LIVEKIT_WS_URL ?? '';
const apiKey = process.env.LIVEKIT_API_KEY ?? '';
const apiSecret = process.env.LIVEKIT_API_SECRET ?? '';

// EgressClient uses HTTP, not WebSocket — convert ws(s):// → http(s)://
const httpUrl = wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');

function getEgressClient() {
  return new EgressClient(httpUrl, apiKey, apiSecret);
}

export function recordingObjectKey(meeting: Meeting): string {
  return `${meeting.livekitRoomName}.ogg`;
}

/**
 * Starts an audio-only room-composite recording for the meeting, uploaded to
 * the S3-compatible bucket configured on the LiveKit Egress service. Best
 * effort — a meeting is still usable if recording fails to start.
 */
export async function startMeetingRecording(meeting: Meeting): Promise<void> {
  try {
    const output = new EncodedFileOutput({
      fileType: EncodedFileType.OGG,
      filepath: recordingObjectKey(meeting)
    });
    const info = await getEgressClient().startRoomCompositeEgress(meeting.livekitRoomName, output, { audioOnly: true });
    await prisma.meeting.update({ where: { id: meeting.id }, data: { egressId: info.egressId, recordingStatus: 'RECORDING' } });
  } catch (err) {
    console.warn('[egress] could not start recording:', (err as Error).message);
    await prisma.meeting.update({ where: { id: meeting.id }, data: { recordingStatus: 'FAILED' } });
  }
}

/** Best effort — stops the meeting's recording, if one was started. */
export async function stopMeetingRecording(meeting: Meeting): Promise<void> {
  if (!meeting.egressId) return;
  try {
    await getEgressClient().stopEgress(meeting.egressId);
  } catch (err) {
    console.warn('[egress] could not stop recording:', (err as Error).message);
  }
  await prisma.meeting.update({ where: { id: meeting.id }, data: { recordingStatus: 'PROCESSING' } });
}

/**
 * Single, non-blocking check of a meeting's recording — mirrors
 * checkLivestreamRecordingStatus. Safe to call from a GET route: it only
 * touches the network/DB when a recording is actually in flight (RECORDING
 * or PROCESSING).
 */
export async function checkMeetingRecordingStatus(meeting: Meeting): Promise<Meeting> {
  if (!meeting.egressId || (meeting.recordingStatus !== 'PROCESSING' && meeting.recordingStatus !== 'RECORDING')) {
    return meeting;
  }

  const [info] = await getEgressClient().listEgress({ egressId: meeting.egressId });
  if (!info) return meeting;

  if (info.status === EgressStatus.EGRESS_COMPLETE) {
    return prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        recordingStatus: 'READY',
        recordingKey: info.fileResults[0]?.filename ?? recordingObjectKey(meeting)
      }
    });
  }

  if (info.status === EgressStatus.EGRESS_FAILED || info.status === EgressStatus.EGRESS_ABORTED) {
    return prisma.meeting.update({ where: { id: meeting.id }, data: { recordingStatus: 'FAILED' } });
  }

  return meeting;
}

/** Polls until the meeting's egress finishes, or the timeout elapses. Returns the final status. */
export async function waitForRecordingToFinish(
  meeting: Meeting,
  { timeoutMs = 60_000, pollIntervalMs = 2_000 }: { timeoutMs?: number; pollIntervalMs?: number } = {}
): Promise<EgressStatus | null> {
  if (!meeting.egressId) return null;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [info] = await getEgressClient().listEgress({ egressId: meeting.egressId });
    if (!info) return null;
    if (
      info.status === EgressStatus.EGRESS_COMPLETE ||
      info.status === EgressStatus.EGRESS_FAILED ||
      info.status === EgressStatus.EGRESS_ABORTED
    ) {
      return info.status;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return null;
}

export function livestreamRecordingObjectKey(livestream: Livestream): string {
  return `${livestream.livekitRoomName}.mp4`;
}

/**
 * Records the livestream host's camera+mic as an MP4 via Track Composite
 * Egress. Deliberately NOT Room Composite: that requires Chrome-based
 * compositing (CPU cost ~3.0), which exceeds this deployment's available
 * egress capacity (2.0) and was confirmed to fail outright. Track Composite
 * skips Chrome and records a single participant's tracks directly, which
 * fits — and is exactly right for a livestream, which only ever has one
 * publisher anyway.
 */
export async function startLivestreamRecording(
  livestream: Livestream,
  tracks: { audioTrackId: string; videoTrackId: string }
): Promise<void> {
  try {
    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: livestreamRecordingObjectKey(livestream)
    });
    const info = await getEgressClient().startTrackCompositeEgress(livestream.livekitRoomName, output, {
      audioTrackId: tracks.audioTrackId,
      videoTrackId: tracks.videoTrackId
    });
    await prisma.livestream.update({
      where: { id: livestream.id },
      data: { egressId: info.egressId, recordingStatus: 'RECORDING' }
    });
  } catch (err) {
    console.warn('[egress] could not start livestream recording:', (err as Error).message);
    await prisma.livestream.update({ where: { id: livestream.id }, data: { recordingStatus: 'FAILED' } });
  }
}

/**
 * Best effort — stops the livestream's recording, if one was started.
 * stopEgress can fail with a precondition error when the egress already
 * finished on its own (LiveKit auto-completes a track-composite recording
 * once its source track closes, which happens as soon as the host
 * disconnects — often before this explicit call reaches the server). That's
 * not a real failure, so recordingStatus still moves to PROCESSING either
 * way; checkLivestreamRecordingStatus resolves it to READY/FAILED next.
 */
export async function stopLivestreamRecording(livestream: Livestream): Promise<void> {
  if (!livestream.egressId) return;
  try {
    await getEgressClient().stopEgress(livestream.egressId);
  } catch (err) {
    console.warn('[egress] stopEgress failed (may have already finished on its own):', (err as Error).message);
  }
  await prisma.livestream.update({ where: { id: livestream.id }, data: { recordingStatus: 'PROCESSING' } });
}

/**
 * Single, non-blocking check of a livestream's recording — unlike
 * waitForRecordingToFinish, this never polls in a loop. Safe to call from a
 * GET route: it only touches the network/DB when a recording is actually in
 * flight (RECORDING or PROCESSING) — RECORDING is included because the
 * egress can auto-complete before the explicit stop call runs, so the
 * status may still say RECORDING even though it's actually done.
 */
export async function checkLivestreamRecordingStatus(livestream: Livestream): Promise<Livestream> {
  if (!livestream.egressId || (livestream.recordingStatus !== 'PROCESSING' && livestream.recordingStatus !== 'RECORDING')) {
    return livestream;
  }

  const [info] = await getEgressClient().listEgress({ egressId: livestream.egressId });
  if (!info) return livestream;

  if (info.status === EgressStatus.EGRESS_COMPLETE) {
    return prisma.livestream.update({
      where: { id: livestream.id },
      data: {
        recordingStatus: 'READY',
        recordingKey: info.fileResults[0]?.filename ?? livestreamRecordingObjectKey(livestream)
      }
    });
  }

  if (info.status === EgressStatus.EGRESS_FAILED || info.status === EgressStatus.EGRESS_ABORTED) {
    return prisma.livestream.update({ where: { id: livestream.id }, data: { recordingStatus: 'FAILED' } });
  }

  return livestream;
}

export { EgressStatus };
