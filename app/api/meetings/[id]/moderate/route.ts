import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { moderateParticipantSchema } from '@/lib/validation/schemas';
import { getOrgScopedMeeting, isMeetingHost } from '@/services/meeting.service';
import { ParticipantTrackNotFoundError, setParticipantTrackMuted } from '@/lib/livekit/token';
import { recordAuditLog } from '@/services/audit.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    if (!isMeetingHost(meeting, user)) {
      return NextResponse.json({ error: 'Only the meeting host can do that.' }, { status: 403 });
    }

    if (!checkRateLimit(`moderate:${user.id}`, { limit: 60, windowMs: 60 * 1000 })) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = moderateParticipantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const { identity, source, muted } = parsed.data;

    try {
      await setParticipantTrackMuted({ roomName: meeting.livekitRoomName, identity, source, muted });
    } catch (err) {
      if (err instanceof ParticipantTrackNotFoundError) {
        return NextResponse.json({ error: `That participant's ${source} isn't on.` }, { status: 400 });
      }
      throw err;
    }

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: muted ? 'PARTICIPANT_MUTED' : 'PARTICIPANT_UNMUTED',
      resourceType: 'Meeting',
      resourceId: meeting.id,
      metadata: { identity, source },
      request
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
