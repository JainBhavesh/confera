import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { translateTranscriptSchema } from '@/lib/validation/schemas';
import { getOrgScopedMeeting } from '@/services/meeting.service';
import { translateTranscript } from '@/services/meetingNotes.service';
import { getResolvedPermissions } from '@/lib/permissions';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    const permissions = await getResolvedPermissions(user);
    if (!permissions.canViewTranscript) {
      return NextResponse.json({ error: 'You do not have permission to view this transcript.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = translateTranscriptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Specify a target language.' }, { status: 400 });
    }

    const translated = await translateTranscript(meeting.id, parsed.data.targetLanguage);
    return NextResponse.json({ targetLanguage: parsed.data.targetLanguage, translated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
