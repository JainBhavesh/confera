import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedMeeting } from '@/services/meeting.service';
import { getMeetingNotes } from '@/services/meetingNotes.service';
import { getResolvedPermissions, redactMeetingNotes } from '@/lib/permissions';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    const notes = await getMeetingNotes(meeting.id);
    if (!notes) {
      return NextResponse.json({ notes: null });
    }

    const permissions = await getResolvedPermissions(user);
    return NextResponse.json({ notes: redactMeetingNotes(notes, permissions) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
