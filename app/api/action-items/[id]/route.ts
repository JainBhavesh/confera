import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { updateActionItemSchema } from '@/lib/validation/schemas';
import { isMeetingHost } from '@/services/meeting.service';
import { recordAuditLog } from '@/services/audit.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const actionItem = await prisma.actionItem.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { meeting: true }
    });
    if (!actionItem) {
      return NextResponse.json({ error: 'Action item not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateActionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    }

    const isHost = isMeetingHost(actionItem.meeting, user);
    const isAssignee = actionItem.assignedToUserId === user.id;
    const onlyStatusChanged = Object.keys(parsed.data).every((key) => key === 'status');

    if (!isHost && !(onlyStatusChanged && isAssignee)) {
      return NextResponse.json({ error: 'Only the meeting host, an admin, or the assignee can update this.' }, { status: 403 });
    }

    const updated = await prisma.actionItem.update({
      where: { id: actionItem.id },
      data: {
        ...parsed.data,
        completedAt: parsed.data.status ? (parsed.data.status === 'COMPLETED' ? new Date() : null) : undefined
      },
      include: { meeting: { select: { id: true, title: true } }, assignedTo: { select: { id: true, name: true } } }
    });

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'ACTION_ITEM_UPDATED',
      resourceType: 'ActionItem',
      resourceId: actionItem.id,
      metadata: { fields: Object.keys(parsed.data) },
      request
    });

    return NextResponse.json({ actionItem: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const actionItem = await prisma.actionItem.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { meeting: true }
    });
    if (!actionItem) {
      return NextResponse.json({ error: 'Action item not found.' }, { status: 404 });
    }
    if (!isMeetingHost(actionItem.meeting, user)) {
      return NextResponse.json({ error: 'Only the meeting host or an admin can delete this.' }, { status: 403 });
    }

    await prisma.actionItem.delete({ where: { id: actionItem.id } });

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'ACTION_ITEM_DELETED',
      resourceType: 'ActionItem',
      resourceId: actionItem.id,
      metadata: { meetingId: actionItem.meetingId },
      request
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
