import type { Meeting, MeetingParticipantSession, User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { generateLiveKitRoomName } from '@/lib/roomUtils';
import { startMeetingRecording, stopMeetingRecording } from '@/services/egress.service';

export async function createMeeting(input: { organizationId: string; createdByUserId: string; title: string }): Promise<Meeting> {
  return prisma.meeting.create({
    data: {
      organizationId: input.organizationId,
      createdByUserId: input.createdByUserId,
      title: input.title,
      status: 'SCHEDULED',
      livekitRoomName: generateLiveKitRoomName(input.organizationId)
    }
  });
}

/** Org-scoped lookup — never trust a client-supplied meeting id alone (spec §25). */
export async function getOrgScopedMeeting(organizationId: string, meetingId: string): Promise<Meeting | null> {
  return prisma.meeting.findFirst({ where: { id: meetingId, organizationId } });
}

/**
 * Host = the meeting's creator, or any org admin (who already has oversight
 * of every meeting in the org elsewhere in the app). Guests are never hosts —
 * they have no User row to check this against in the first place.
 */
export function isMeetingHost(meeting: Pick<Meeting, 'createdByUserId'>, user: Pick<User, 'id' | 'role'>): boolean {
  return user.role === 'ADMIN' || user.id === meeting.createdByUserId;
}

/**
 * Lookup for an unauthenticated visitor following a public invite link — not
 * org-scoped (a guest has no organizationId to scope by). The caller MUST
 * still check `organization.publicMeetingsEnabled` before treating this as
 * authorization to join; this only resolves the meeting + its org's setting.
 */
export async function getMeetingForGuestAccess(meetingId: string) {
  return prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { organization: { select: { id: true, name: true, publicMeetingsEnabled: true } } }
  });
}

type Participant = { type: 'user'; user: User } | { type: 'guest'; identity: string; name: string };

export async function joinMeeting(
  meeting: Meeting,
  participant: Participant
): Promise<{ meeting: Meeting; session: MeetingParticipantSession }> {
  let currentMeeting = meeting;
  if (meeting.status === 'SCHEDULED') {
    currentMeeting = await prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: 'LIVE', startedAt: meeting.startedAt ?? new Date() }
    });
    await startMeetingRecording(currentMeeting);
  }

  if (participant.type === 'user') {
    // Idempotent: reuse an already-open session instead of creating a
    // duplicate (e.g. a double-invoked join). A genuine reconnect after
    // /leave creates a fresh session row, which is how spec §11 wants
    // reconnects tracked.
    const existingOpenSession = await prisma.meetingParticipantSession.findFirst({
      where: { meetingId: meeting.id, userId: participant.user.id, leftAt: null }
    });
    if (existingOpenSession) {
      return { meeting: currentMeeting, session: existingOpenSession };
    }

    const session = await prisma.meetingParticipantSession.create({
      data: { meetingId: meeting.id, userId: participant.user.id }
    });
    return { meeting: currentMeeting, session };
  }

  // Guests get a fresh session per join — there's no stable server-known
  // identity to dedupe against across requests (no session cookie).
  const session = await prisma.meetingParticipantSession.create({
    data: { meetingId: meeting.id, userId: null, guestName: participant.name }
  });
  return { meeting: currentMeeting, session };
}

export async function leaveMeeting(meetingId: string, userId: string) {
  const openSession = await prisma.meetingParticipantSession.findFirst({
    where: { meetingId, userId, leftAt: null },
    orderBy: { joinedAt: 'desc' }
  });
  if (!openSession) return null;

  return closeParticipantSession(openSession);
}

/** Guest equivalent of leaveMeeting — matched by session id since guests carry no server-known identity. */
export async function leaveMeetingAsGuest(meetingId: string, sessionId: string) {
  const openSession = await prisma.meetingParticipantSession.findFirst({
    where: { id: sessionId, meetingId, userId: null, leftAt: null }
  });
  if (!openSession) return null;

  return closeParticipantSession(openSession);
}

function closeParticipantSession(openSession: MeetingParticipantSession) {
  const leftAt = new Date();
  const durationSeconds = Math.max(0, Math.round((leftAt.getTime() - openSession.joinedAt.getTime()) / 1000));

  return prisma.meetingParticipantSession.update({
    where: { id: openSession.id },
    data: { leftAt, durationSeconds }
  });
}

export async function endMeeting(meetingId: string) {
  const endedAt = new Date();

  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  await stopMeetingRecording(meeting);

  const openSessions = await prisma.meetingParticipantSession.findMany({
    where: { meetingId, leftAt: null }
  });

  await Promise.all(
    openSessions.map((session) =>
      prisma.meetingParticipantSession.update({
        where: { id: session.id },
        data: {
          leftAt: endedAt,
          durationSeconds: Math.max(0, Math.round((endedAt.getTime() - session.joinedAt.getTime()) / 1000))
        }
      })
    )
  );

  return prisma.meeting.update({
    where: { id: meetingId },
    data: { status: 'ENDED', endedAt }
  });
}
