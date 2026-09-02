import type { Livestream, LivestreamViewerSession, User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { generateLivestreamRoomName } from '@/lib/roomUtils';
import { stopLivestreamRecording } from '@/services/egress.service';

export async function createLivestream(input: {
  organizationId: string;
  createdByUserId: string;
  title: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}): Promise<Livestream> {
  return prisma.livestream.create({
    data: {
      organizationId: input.organizationId,
      createdByUserId: input.createdByUserId,
      title: input.title,
      status: 'SCHEDULED',
      visibility: input.visibility ?? 'PRIVATE',
      livekitRoomName: generateLivestreamRoomName(input.organizationId)
    }
  });
}

/** Org-scoped lookup — never trust a client-supplied livestream id alone (spec §25 pattern). */
export async function getOrgScopedLivestream(organizationId: string, livestreamId: string): Promise<Livestream | null> {
  return prisma.livestream.findFirst({ where: { id: livestreamId, organizationId } });
}

/**
 * Lookup for an unauthenticated visitor following a public watch link — not
 * org-scoped (a guest has no organizationId to scope by). The caller MUST
 * still check `visibility === 'PUBLIC'` before treating this as authorization
 * to join; unlike meetings' org-wide publicMeetingsEnabled, visibility is set
 * per-livestream.
 */
export async function getLivestreamForGuestAccess(livestreamId: string): Promise<Livestream | null> {
  return prisma.livestream.findUnique({ where: { id: livestreamId } });
}

type Viewer = { type: 'user'; user: User } | { type: 'guest'; identity: string; name: string };

export async function joinLivestreamAsViewer(livestreamId: string, viewer: Viewer): Promise<LivestreamViewerSession> {
  if (viewer.type === 'user') {
    // Idempotent, mirrors joinMeeting: reuse an already-open session instead
    // of creating a duplicate on a double-invoked join.
    const existingOpenSession = await prisma.livestreamViewerSession.findFirst({
      where: { livestreamId, userId: viewer.user.id, leftAt: null }
    });
    if (existingOpenSession) return existingOpenSession;

    return prisma.livestreamViewerSession.create({
      data: { livestreamId, userId: viewer.user.id }
    });
  }

  // Guests get a fresh session per join — no stable server-known identity to
  // dedupe against across requests (no session cookie).
  return prisma.livestreamViewerSession.create({
    data: { livestreamId, userId: null, guestName: viewer.name }
  });
}

export async function leaveLivestreamViewer(livestreamId: string, userId: string) {
  const openSession = await prisma.livestreamViewerSession.findFirst({
    where: { livestreamId, userId, leftAt: null },
    orderBy: { joinedAt: 'desc' }
  });
  if (!openSession) return null;

  return prisma.livestreamViewerSession.update({
    where: { id: openSession.id },
    data: { leftAt: new Date() }
  });
}

/** Guest equivalent of leaveLivestreamViewer — matched by session id since guests carry no server-known identity. */
export async function leaveLivestreamViewerAsGuest(livestreamId: string, sessionId: string) {
  const openSession = await prisma.livestreamViewerSession.findFirst({
    where: { id: sessionId, livestreamId, userId: null, leftAt: null }
  });
  if (!openSession) return null;

  return prisma.livestreamViewerSession.update({
    where: { id: openSession.id },
    data: { leftAt: new Date() }
  });
}

export async function goLive(livestream: Livestream): Promise<Livestream> {
  if (livestream.status === 'LIVE') return livestream;
  return prisma.livestream.update({
    where: { id: livestream.id },
    data: { status: 'LIVE', startedAt: livestream.startedAt ?? new Date() }
  });
}

export async function endLivestream(livestreamId: string): Promise<Livestream> {
  const livestream = await prisma.livestream.findUniqueOrThrow({ where: { id: livestreamId } });
  await stopLivestreamRecording(livestream);

  return prisma.livestream.update({
    where: { id: livestreamId },
    data: { status: 'ENDED', endedAt: new Date() }
  });
}
