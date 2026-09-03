import type { Meeting, MeetingParticipantSession, MeetingRecurrence, User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { generateLiveKitRoomName } from '@/lib/roomUtils';
import { startMeetingRecording, stopMeetingRecording } from '@/services/egress.service';

export async function createMeeting(input: {
  organizationId: string;
  createdByUserId: string;
  title: string;
  scheduledAt?: Date;
  recurrence?: MeetingRecurrence;
}): Promise<Meeting> {
  return prisma.meeting.create({
    data: {
      organizationId: input.organizationId,
      createdByUserId: input.createdByUserId,
      title: input.title,
      status: 'SCHEDULED',
      scheduledAt: input.scheduledAt,
      recurrence: input.recurrence ?? 'ONCE',
      livekitRoomName: generateLiveKitRoomName(input.organizationId)
    }
  });
}

/** Org-scoped lookup — never trust a client-supplied meeting id alone (spec §25). */
export async function getOrgScopedMeeting(organizationId: string, meetingId: string): Promise<Meeting | null> {
  return prisma.meeting.findFirst({ where: { id: meetingId, organizationId } });
}

// How many future occurrences a recurring schedule materializes up front, and
// the step between them. Each occurrence is its own real Meeting row (own
// room, recording, notes, action items) — this isn't a virtual/projected
// series, so the count is deliberately bounded rather than open-ended: a
// daily series runs 2 weeks out, weekly ~2 months, monthly ~half a year.
const RECURRENCE_STEPS: Record<Exclude<MeetingRecurrence, 'ONCE'>, { count: number; days?: number; months?: number }> = {
  DAILY: { count: 13, days: 1 },
  WEEKLY: { count: 7, days: 7 },
  MONTHLY: { count: 5, months: 1 }
};

/**
 * Materializes the repeat occurrences implied by `firstMeeting.recurrence` —
 * one real Meeting row per occurrence, sharing recurringGroupId (the first
 * occurrence's own id). No-op for a one-off meeting or one with no
 * scheduledAt to step forward from. Called right after createMeeting when
 * the caller selected anything but "Once".
 */
export async function generateRecurringOccurrences(firstMeeting: Meeting): Promise<Meeting[]> {
  if (firstMeeting.recurrence === 'ONCE' || !firstMeeting.scheduledAt) return [];

  const step = RECURRENCE_STEPS[firstMeeting.recurrence];
  await prisma.meeting.update({ where: { id: firstMeeting.id }, data: { recurringGroupId: firstMeeting.id } });

  const occurrences: Meeting[] = [];
  let cursor = new Date(firstMeeting.scheduledAt);

  for (let i = 0; i < step.count; i++) {
    cursor = new Date(cursor);
    if (step.days) cursor.setDate(cursor.getDate() + step.days);
    if (step.months) cursor.setMonth(cursor.getMonth() + step.months);

    const occurrence = await prisma.meeting.create({
      data: {
        organizationId: firstMeeting.organizationId,
        createdByUserId: firstMeeting.createdByUserId,
        title: firstMeeting.title,
        status: 'SCHEDULED',
        scheduledAt: new Date(cursor),
        recurrence: firstMeeting.recurrence,
        recurringGroupId: firstMeeting.id,
        livekitRoomName: generateLiveKitRoomName(firstMeeting.organizationId)
      }
    });
    occurrences.push(occurrence);
  }

  return occurrences;
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
  // A SCHEDULED meeting goes live on its first join. An ENDED one can still
  // be rejoined via the same URL/id — everyone having left (or the 30-minute
  // no-show sweep) doesn't retire the link, it just closes that occurrence;
  // walking back in re-opens it as a fresh LIVE session with its own
  // recording, same as starting over.
  if (meeting.status === 'SCHEDULED' || meeting.status === 'ENDED') {
    currentMeeting = await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        status: 'LIVE',
        startedAt: meeting.status === 'ENDED' ? new Date() : (meeting.startedAt ?? new Date()),
        endedAt: null
      }
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

  const session = await closeParticipantSession(openSession);
  await endMeetingIfEmpty(meetingId);
  return session;
}

/** Guest equivalent of leaveMeeting — matched by session id since guests carry no server-known identity. */
export async function leaveMeetingAsGuest(meetingId: string, sessionId: string) {
  const openSession = await prisma.meetingParticipantSession.findFirst({
    where: { id: sessionId, meetingId, userId: null, leftAt: null }
  });
  if (!openSession) return null;

  const session = await closeParticipantSession(openSession);
  await endMeetingIfEmpty(meetingId);
  return session;
}

function closeParticipantSession(openSession: MeetingParticipantSession) {
  const leftAt = new Date();
  const durationSeconds = Math.max(0, Math.round((leftAt.getTime() - openSession.joinedAt.getTime()) / 1000));

  return prisma.meetingParticipantSession.update({
    where: { id: openSession.id },
    data: { leftAt, durationSeconds }
  });
}

/** Once the last participant leaves a LIVE meeting, it's over — stop recording and close it out. */
async function endMeetingIfEmpty(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { status: true } });
  if (!meeting || meeting.status !== 'LIVE') return;

  const stillOpen = await prisma.meetingParticipantSession.count({ where: { meetingId, leftAt: null } });
  if (stillOpen === 0) {
    await endMeeting(meetingId);
  }
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

const NO_SHOW_WINDOW_MS = 30 * 60 * 1000;

/**
 * Ends SCHEDULED meetings nobody ever joined within 30 minutes of when they
 * were supposed to start — an instant "Start a meeting" room abandoned right
 * after creation, or a scheduled one whose time came and went with no
 * attendees. Never touches a meeting with even one recorded participant
 * session, and never touches a still-upcoming scheduled meeting (the 30
 * minutes are measured from scheduledAt, not from createdAt, for those).
 * Intended to be called periodically — see instrumentation.ts.
 */
export async function endAbandonedMeetings(): Promise<number> {
  const candidates = await prisma.meeting.findMany({
    where: { status: 'SCHEDULED', participantSessions: { none: {} } },
    select: { id: true, scheduledAt: true, createdAt: true }
  });

  const now = Date.now();
  const staleIds = candidates
    .filter((m) => now - (m.scheduledAt ?? m.createdAt).getTime() >= NO_SHOW_WINDOW_MS)
    .map((m) => m.id);

  if (staleIds.length === 0) return 0;

  await prisma.meeting.updateMany({
    where: { id: { in: staleIds } },
    data: { status: 'ENDED', endedAt: new Date() }
  });

  return staleIds.length;
}

/**
 * Safety net for endMeetingIfEmpty: catches a LIVE meeting left with zero
 * open participant sessions when nobody ever called /leave for the last one
 * (a closed tab, a crashed browser, a dropped connection) — the same "all
 * users leave → meeting is ended" rule, just for the case where leaving
 * happened without telling the server. Intended to be called periodically —
 * see instrumentation.ts.
 */
export async function endOrphanedLiveMeetings(): Promise<number> {
  const liveMeetings = await prisma.meeting.findMany({
    where: { status: 'LIVE' },
    select: { id: true, _count: { select: { participantSessions: { where: { leftAt: null } } } } }
  });

  const orphaned = liveMeetings.filter((m) => m._count.participantSessions === 0);
  for (const meeting of orphaned) {
    await endMeeting(meeting.id);
  }

  return orphaned.length;
}
