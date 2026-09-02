import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedMeeting } from '@/services/meeting.service';

type RouteContext = { params: Promise<{ id: string }> };

// Participant time logs — admin or the meeting's host only (spec §33).
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }
    if (meeting.createdByUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sessions = await prisma.meetingParticipantSession.findMany({
      where: { meetingId: meeting.id },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    return toErrorResponse(err);
  }
}
