import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { meetingMessageSchema } from '@/lib/validation/schemas';
import { getOrgScopedMeeting } from '@/services/meeting.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    const messages = await prisma.meetingMessage.findMany({
      where: { meetingId: meeting.id },
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
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = meetingMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message.' }, { status: 400 });
    }

    // Plain text only — React escapes it on render, so no HTML sanitization
    // step is needed as long as callers never dangerouslySetInnerHTML it.
    const message = await prisma.meetingMessage.create({
      data: { meetingId: meeting.id, userId: user.id, message: parsed.data.message },
      include: { user: { select: { id: true, name: true } } }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
