import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedLivestream } from '@/services/livestream.service';
import { recordAuditLog } from '@/services/audit.service';

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id, messageId } = await params;

    const livestream = await getOrgScopedLivestream(admin.organizationId, id);
    if (!livestream) {
      return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
    }

    const message = await prisma.livestreamMessage.findFirst({ where: { id: messageId, livestreamId: livestream.id } });
    if (!message) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    await prisma.livestreamMessage.delete({ where: { id: message.id } });

    await recordAuditLog({
      organizationId: admin.organizationId,
      actorUserId: admin.id,
      action: 'CHAT_MESSAGE_DELETED',
      resourceType: 'LivestreamMessage',
      resourceId: message.id,
      metadata: { livestreamId: livestream.id },
      request
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
