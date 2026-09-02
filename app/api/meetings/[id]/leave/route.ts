import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/guards';
import { guestLeaveSchema } from '@/lib/validation/schemas';
import { getOrgScopedMeeting, leaveMeeting, leaveMeetingAsGuest } from '@/services/meeting.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (user) {
      const meeting = await getOrgScopedMeeting(user.organizationId, id);
      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
      }

      const session = await leaveMeeting(meeting.id, user.id);
      return NextResponse.json({ session });
    }

    // Guests carry no session cookie to identify them by — the client sends
    // back the sessionId it received from /join, and leaveMeetingAsGuest
    // only closes it if it's genuinely an open guest session on this meeting.
    const body = await request.json().catch(() => null);
    const parsed = guestLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const session = await leaveMeetingAsGuest(id, parsed.data.sessionId);
    return NextResponse.json({ session });
  } catch (err) {
    return toErrorResponse(err);
  }
}
