import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/guards';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { guestJoinSchema } from '@/lib/validation/schemas';
import { getMeetingForGuestAccess, getOrgScopedMeeting, joinMeeting } from '@/services/meeting.service';
import { ensureRoomExists, mintMeetingToken } from '@/lib/livekit/token';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (user) {
      // Org-scoped lookup is the authorization check — a meeting id from
      // another organization returns 404, never leaks room details.
      const existingMeeting = await getOrgScopedMeeting(user.organizationId, id);
      if (!existingMeeting) {
        return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
      }
      if (existingMeeting.status === 'ENDED' || existingMeeting.status === 'CANCELLED') {
        return NextResponse.json({ error: 'This meeting has ended.' }, { status: 400 });
      }

      const { meeting } = await joinMeeting(existingMeeting, { type: 'user', user });

      try {
        await ensureRoomExists(meeting.livekitRoomName);
      } catch (err) {
        console.warn('[join] could not pre-create LiveKit room:', (err as Error).message);
      }

      const token = await mintMeetingToken({ roomName: meeting.livekitRoomName, identity: user.id, name: user.name });

      return NextResponse.json({
        token,
        serverUrl: process.env.LIVEKIT_WS_URL,
        roomName: meeting.livekitRoomName,
        meeting,
        isGuest: false
      });
    }

    // No session — only proceed if this meeting's organization has opted
    // into public, link-only join (see Admin → Settings).
    const ip = getRequestIp(request);
    if (!checkRateLimit(`guest-join:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = guestJoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter your name to join.' }, { status: 400 });
    }

    const record = await getMeetingForGuestAccess(id);
    if (!record || !record.organization.publicMeetingsEnabled) {
      return NextResponse.json({ error: 'Please log in to join this meeting.', code: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    if (record.status === 'ENDED' || record.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This meeting has ended.' }, { status: 400 });
    }

    const guestIdentity = `guest-${randomBytes(9).toString('base64url')}`;

    // `record` carries an extra `organization` field, but joinMeeting only
    // reads Meeting's own columns — TypeScript's structural typing allows
    // passing it as-is (excess-property checks only apply to object literals).
    const { meeting, session } = await joinMeeting(record, {
      type: 'guest',
      identity: guestIdentity,
      name: parsed.data.guestName
    });

    try {
      await ensureRoomExists(meeting.livekitRoomName);
    } catch (err) {
      console.warn('[join] could not pre-create LiveKit room:', (err as Error).message);
    }

    const token = await mintMeetingToken({
      roomName: meeting.livekitRoomName,
      identity: guestIdentity,
      name: parsed.data.guestName
    });

    return NextResponse.json({
      token,
      serverUrl: process.env.LIVEKIT_WS_URL,
      roomName: meeting.livekitRoomName,
      meeting,
      isGuest: true,
      sessionId: session.id
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
