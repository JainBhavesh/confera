import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedMeeting } from '@/services/meeting.service';
import { checkMeetingRecordingStatus } from '@/services/egress.service';
import { streamLocalRecording } from '@/lib/recordingStorage';
import { getResolvedPermissions } from '@/lib/permissions';

type RouteContext = { params: Promise<{ id: string }> };

/** Streams a locally-stored meeting recording (RECORDING_STORAGE_MODE=local). */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const existing = await getOrgScopedMeeting(user.organizationId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    const permissions = await getResolvedPermissions(user);
    if (!permissions.canViewRecording) {
      return NextResponse.json({ error: 'You do not have permission to view recordings.' }, { status: 403 });
    }

    const meeting = await checkMeetingRecordingStatus(existing);
    if (meeting.recordingStatus !== 'READY' || !meeting.recordingKey) {
      return NextResponse.json({ error: 'Recording not available.' }, { status: 404 });
    }

    return streamLocalRecording(request, meeting.recordingKey, 'audio/ogg');
  } catch (err) {
    return toErrorResponse(err);
  }
}
