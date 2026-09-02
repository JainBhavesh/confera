import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/guards';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { livestreamMessageSchema } from '@/lib/validation/schemas';
import { getLivestreamForGuestAccess, getOrgScopedLivestream } from '@/services/livestream.service';
import type { Livestream } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    let livestream: Livestream | null;
    if (user) {
      livestream = await getOrgScopedLivestream(user.organizationId, id);
      if (!livestream) {
        return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
      }
    } else {
      const record = await getLivestreamForGuestAccess(id);
      if (!record || record.visibility !== 'PUBLIC') {
        return NextResponse.json({ error: 'Please log in to watch this livestream.', code: 'LOGIN_REQUIRED' }, { status: 401 });
      }
      livestream = record;
    }

    const messages = await prisma.livestreamMessage.findMany({
      where: { livestreamId: livestream.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true } } }
    });

    return NextResponse.json({ messages });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const body = await request.json().catch(() => null);
    const parsed = livestreamMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message.' }, { status: 400 });
    }

    if (user) {
      const livestream = await getOrgScopedLivestream(user.organizationId, id);
      if (!livestream) {
        return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
      }
      if (!livestream.chatEnabled) {
        return NextResponse.json({ error: 'Chat is disabled for this livestream.' }, { status: 403 });
      }

      // Plain text only — React escapes it on render, so no HTML sanitization
      // step is needed as long as callers never dangerouslySetInnerHTML it.
      const message = await prisma.livestreamMessage.create({
        data: { livestreamId: livestream.id, userId: user.id, message: parsed.data.message },
        include: { user: { select: { id: true, name: true } } }
      });

      return NextResponse.json({ message }, { status: 201 });
    }

    // Guest chat — rate-limited since it's an unauthenticated write.
    const ip = getRequestIp(request);
    if (!checkRateLimit(`guest-live-msg:${ip}`, { limit: 30, windowMs: 60 * 1000 })) {
      return NextResponse.json({ error: 'Too many messages. Slow down.' }, { status: 429 });
    }

    const record = await getLivestreamForGuestAccess(id);
    if (!record || record.visibility !== 'PUBLIC') {
      return NextResponse.json({ error: 'Please log in to watch this livestream.', code: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    if (!record.chatEnabled) {
      return NextResponse.json({ error: 'Chat is disabled for this livestream.' }, { status: 403 });
    }
    if (!parsed.data.sessionId) {
      return NextResponse.json({ error: 'Missing viewer session.' }, { status: 400 });
    }

    // Resolve the guest's display name server-side from the session created
    // at join time, rather than trusting a client-supplied name on every
    // message — otherwise a guest could spoof a different name mid-conversation.
    const session = await prisma.livestreamViewerSession.findFirst({
      where: { id: parsed.data.sessionId, livestreamId: record.id, userId: null, leftAt: null }
    });
    if (!session || !session.guestName) {
      return NextResponse.json({ error: 'Please rejoin to send messages.', code: 'LOGIN_REQUIRED' }, { status: 401 });
    }

    const message = await prisma.livestreamMessage.create({
      data: { livestreamId: record.id, guestName: session.guestName, message: parsed.data.message },
      include: { user: { select: { id: true, name: true } } }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
