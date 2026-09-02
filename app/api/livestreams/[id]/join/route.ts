import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/guards';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { guestJoinSchema } from '@/lib/validation/schemas';
import { getLivestreamForGuestAccess, getOrgScopedLivestream, joinLivestreamAsViewer } from '@/services/livestream.service';
import { ensureRoomExists, mintLivestreamToken } from '@/lib/livekit/token';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (user) {
      // Org-scoped lookup is the authorization check — a livestream id from
      // another organization returns 404, never leaks room details.
      const livestream = await getOrgScopedLivestream(user.organizationId, id);
      if (!livestream) {
        return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
      }
      if (livestream.status !== 'LIVE') {
        return NextResponse.json({ error: 'This livestream is not live right now.' }, { status: 400 });
      }

      await joinLivestreamAsViewer(livestream.id, { type: 'user', user });

      const token = await mintLivestreamToken({
        roomName: livestream.livekitRoomName,
        identity: user.id,
        name: user.name,
        canPublish: false
      });

      return NextResponse.json({
        token,
        serverUrl: process.env.LIVEKIT_WS_URL,
        roomName: livestream.livekitRoomName,
        livestream,
        isGuest: false
      });
    }

    // No session — only proceed if this specific livestream has been made
    // PUBLIC (per-livestream, unlike meetings' org-wide publicMeetingsEnabled).
    const ip = getRequestIp(request);
    if (!checkRateLimit(`guest-live-join:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = guestJoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter your name to join.' }, { status: 400 });
    }

    const record = await getLivestreamForGuestAccess(id);
    if (!record || record.visibility !== 'PUBLIC') {
      return NextResponse.json({ error: 'Please log in to watch this livestream.', code: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    if (record.status !== 'LIVE') {
      return NextResponse.json({ error: 'This livestream is not live right now.' }, { status: 400 });
    }

    const guestIdentity = `guest-${randomBytes(9).toString('base64url')}`;
    const session = await joinLivestreamAsViewer(record.id, {
      type: 'guest',
      identity: guestIdentity,
      name: parsed.data.guestName
    });

    try {
      await ensureRoomExists(record.livekitRoomName);
    } catch (err) {
      console.warn('[join] could not pre-create LiveKit room:', (err as Error).message);
    }

    const token = await mintLivestreamToken({
      roomName: record.livekitRoomName,
      identity: guestIdentity,
      name: parsed.data.guestName,
      canPublish: false
    });

    return NextResponse.json({
      token,
      serverUrl: process.env.LIVEKIT_WS_URL,
      roomName: record.livekitRoomName,
      livestream: record,
      isGuest: true,
      sessionId: session.id
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
