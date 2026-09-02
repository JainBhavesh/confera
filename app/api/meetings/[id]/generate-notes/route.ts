import { NextRequest, NextResponse, after } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedMeeting } from '@/services/meeting.service';
import { generateMeetingNotes, getMeetingNotes } from '@/services/meetingNotes.service';
import { prisma } from '@/lib/db/prisma';
import { getResolvedPermissions } from '@/lib/permissions';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    // Admins can generate notes for any meeting in the org; other users only for meetings they host.
    if (user.role !== 'ADMIN' && meeting.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Only the host or an admin can generate notes for this meeting.' }, { status: 403 });
    }

    const permissions = await getResolvedPermissions(user);
    if (!permissions.canGenerateNotes) {
      return NextResponse.json({ error: 'You do not have permission to generate meeting notes.' }, { status: 403 });
    }

    if (meeting.status !== 'ENDED') {
      return NextResponse.json({ error: 'Notes can only be generated after the meeting has ended.' }, { status: 400 });
    }

    await prisma.meetingNotes.upsert({
      where: { meetingId: meeting.id },
      create: { meetingId: meeting.id, status: 'PENDING' },
      update: { status: 'PENDING', error: null }
    });

    // Runs after the response is sent — doesn't block on transcription + summarization.
    after(() =>
      generateMeetingNotes(meeting.id).catch((err) => console.error('[meeting-notes] failed to generate:', err))
    );

    const notes = await getMeetingNotes(meeting.id);
    return NextResponse.json({ notes });
  } catch (err) {
    return toErrorResponse(err);
  }
}
