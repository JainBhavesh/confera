import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, toErrorResponse } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/password';
import { createUserSchema } from '@/lib/validation/schemas';
import { toPublicUser } from '@/services/user.service';
import { recordAuditLog } from '@/services/audit.service';

export async function GET() {
  try {
    const admin = await requireAdmin();

    const users = await prisma.user.findMany({
      where: { organizationId: admin.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users: users.map(toPublicUser) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json().catch(() => null);
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid user details.' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Public registration can select USER only; this is the same rule here —
    // admin-created accounts are always USER (spec §4). Promoting to ADMIN is
    // not exposed via this endpoint.
    const user = await prisma.user.create({
      data: {
        organizationId: admin.organizationId,
        name,
        email,
        passwordHash,
        role: 'USER',
        isActive: true,
        // Admin-created accounts skip the self-service OTP step — the admin
        // is vouching for the email directly.
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    await recordAuditLog({
      organizationId: admin.organizationId,
      actorUserId: admin.id,
      action: 'USER_CREATED',
      resourceType: 'User',
      resourceId: user.id,
      metadata: { email: user.email },
      request
    });

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
