import { NextRequest, NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/auth/guards';
import { getCurrentUser } from '@/lib/auth/session';
import { getLivestreamForGuestAccess, getOrgScopedLivestream } from '@/services/livestream.service';
import { checkLivestreamRecordingStatus } from '@/services/egress.service';
import { getRecordingDownloadUrl } from '@/lib/recordingStorage';
import type { Livestream } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
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

    // Cheap, single-shot check — only touches the network/DB when a
    // recording is actually in flight (status PROCESSING).
    const livestream = await checkLivestreamRecordingStatus(existing);

    if (livestream.recordingStatus !== 'READY' || !livestream.recordingKey) {
      return NextResponse.json({ status: livestream.recordingStatus, url: null });
    }

    const url = await getRecordingDownloadUrl(livestream.recordingKey);
    return NextResponse.json({ status: livestream.recordingStatus, url });
  } catch (err) {
    return toErrorResponse(err);
  }
}
