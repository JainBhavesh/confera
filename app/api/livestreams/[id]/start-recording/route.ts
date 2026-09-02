import { NextRequest, NextResponse } from 'next/server';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { startLivestreamRecordingSchema } from '@/lib/validation/schemas';
import { getOrgScopedLivestream } from '@/services/livestream.service';
import { startLivestreamRecording } from '@/services/egress.service';

type RouteContext = { params: Promise<{ id: string }> };

// Called by the host's client once its camera/mic tracks are actually
// published — Track Composite Egress needs their track IDs, which don't
// exist until then, so recording can't start any earlier (e.g. at go-live).
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const livestream = await getOrgScopedLivestream(user.organizationId, id);
    if (!livestream) {
      return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
    }
    if (livestream.createdByUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the host or an admin can start recording.' }, { status: 403 });
    }
    if (livestream.status !== 'LIVE') {
      return NextResponse.json({ error: 'The livestream must be live to start recording.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = startLivestreamRecordingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid track ids.' }, { status: 400 });
    }

    await startLivestreamRecording(livestream, parsed.data);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
