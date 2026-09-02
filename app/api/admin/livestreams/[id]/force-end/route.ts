import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedLivestream, endLivestream } from '@/services/livestream.service';
import { recordAuditLog } from '@/services/audit.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const livestream = await getOrgScopedLivestream(admin.organizationId, id);
    if (!livestream) {
      return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
    }
    if (livestream.status !== 'LIVE') {
      return NextResponse.json({ error: 'This livestream is not currently live.' }, { status: 400 });
    }

    const updated = await endLivestream(livestream.id);

    await recordAuditLog({
      organizationId: admin.organizationId,
      actorUserId: admin.id,
      action: 'LIVESTREAM_FORCE_ENDED',
      resourceType: 'Livestream',
      resourceId: livestream.id,
      request
    });

    return NextResponse.json({ livestream: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
