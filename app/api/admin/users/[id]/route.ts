import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, toErrorResponse } from '@/lib/auth/guards';
import { updateUserSchema } from '@/lib/validation/schemas';
import { toPublicUser } from '@/services/user.service';
import { recordAuditLog } from '@/services/audit.service';
import { PERMISSION_KEYS } from '@/lib/permissions';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    }

    // Org-scoped lookup — never trust the :id alone (spec §25).
    const target = await prisma.user.findFirst({
      where: { id, organizationId: admin.organizationId }
    });
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (target.id === admin.id && parsed.data.isActive === false) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: parsed.data
    });

    if (parsed.data.isActive !== undefined && parsed.data.isActive !== target.isActive) {
      await recordAuditLog({
        organizationId: admin.organizationId,
        actorUserId: admin.id,
        action: parsed.data.isActive ? 'USER_ENABLED' : 'USER_DISABLED',
        resourceType: 'User',
        resourceId: updated.id,
        request
      });
    }

    const changedPermissions = PERMISSION_KEYS.filter((key) => parsed.data[key] !== undefined);
    if (changedPermissions.length > 0) {
      await recordAuditLog({
        organizationId: admin.organizationId,
        actorUserId: admin.id,
        action: 'USER_PERMISSIONS_UPDATED',
        resourceType: 'User',
        resourceId: updated.id,
        metadata: { changed: changedPermissions },
        request
      });
    }

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const target = await prisma.user.findFirst({
      where: { id, organizationId: admin.organizationId }
    });
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (target.id === admin.id) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
    }

    // "Delete" deactivates rather than hard-deletes, per spec §3 ("Activate/deactivate users").
    const updated = await prisma.user.update({ where: { id: target.id }, data: { isActive: false } });

    await recordAuditLog({
      organizationId: admin.organizationId,
      actorUserId: admin.id,
      action: 'USER_DISABLED',
      resourceType: 'User',
      resourceId: updated.id,
      request
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
