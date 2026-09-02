import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedMeeting } from '@/services/meeting.service';
import { checkMeetingRecordingStatus } from '@/services/egress.service';
import { getRecordingDownloadUrl } from '@/lib/recordingStorage';
import { getResolvedPermissions } from '@/lib/permissions';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
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

    // Cheap, single-shot check — only touches the network/DB when a
    // recording is actually in flight (status PROCESSING/RECORDING).
    const meeting = await checkMeetingRecordingStatus(existing);

    if (meeting.recordingStatus !== 'READY' || !meeting.recordingKey) {
      return NextResponse.json({ status: meeting.recordingStatus, url: null });
    }

    const url = await getRecordingDownloadUrl(meeting.recordingKey);
    return NextResponse.json({ status: meeting.recordingStatus, url });
  } catch (err) {
    return toErrorResponse(err);
  }
}
