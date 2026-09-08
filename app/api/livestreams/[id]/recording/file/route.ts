import { NextRequest, NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/auth/guards';
import { getCurrentUser } from '@/lib/auth/session';
import { getLivestreamForGuestAccess, getOrgScopedLivestream } from '@/services/livestream.service';
import { checkLivestreamRecordingStatus } from '@/services/egress.service';
import { streamLocalRecording } from '@/lib/recordingStorage';
import type { Livestream } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

/** Streams a locally-stored livestream recording (RECORDING_STORAGE_MODE=local). */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    let existing: Livestream | null;
    if (user) {
      existing = await getOrgScopedLivestream(user.organizationId, id);
      if (!existing) {
        return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
      }
    } else {
      const record = await getLivestreamForGuestAccess(id);
      if (!record || record.visibility !== 'PUBLIC') {
        return NextResponse.json({ error: 'Please log in to watch this livestream.', code: 'LOGIN_REQUIRED' }, { status: 401 });
      }
      existing = record;
    }

    const livestream = await checkLivestreamRecordingStatus(existing);
    if (livestream.recordingStatus !== 'READY' || !livestream.recordingKey) {
      return NextResponse.json({ error: 'Recording not available.' }, { status: 404 });
    }

    return streamLocalRecording(request, livestream.recordingKey, 'video/mp4');
  } catch (err) {
    return toErrorResponse(err);
  }
}
