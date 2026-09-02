import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { issueOtp } from '@/lib/auth/otp';
import { registerSchema } from '@/lib/validation/schemas';
import { getPublicOrganization } from '@/services/org.service';
import { avatarStorageConfigured, uploadAvatarBuffer } from '@/lib/avatarStorage';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'Invalid registration details.' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse({
    name: form.get('name'),
    email: form.get('email'),
    password: form.get('password')
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid registration details.' }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const rateLimitKey = `register:${getRequestIp(request)}`;
  if (!checkRateLimit(rateLimitKey, { limit: 5, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  // Server-side enforcement — never trust a client-side "registration disabled" state.
  const organization = await getPublicOrganization();
  if (!organization || !organization.registrationEnabled) {
    return NextResponse.json({ error: 'Registration is currently disabled.' }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const avatarFile = form.get('avatar');
  let avatarUrl: string | null = null;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!avatarStorageConfigured()) {
      return NextResponse.json({ error: 'Profile picture upload is not available right now.' }, { status: 503 });
    }
    if (!ALLOWED_AVATAR_TYPES.has(avatarFile.type)) {
      return NextResponse.json({ error: 'Profile picture must be a JPEG, PNG, WebP, or GIF image.' }, { status: 400 });
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: 'Profile picture must be smaller than 5MB.' }, { status: 400 });
    }
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    avatarUrl = await uploadAvatarBuffer({ body: buffer, contentType: avatarFile.type });
  }

  const passwordHash = await hashPassword(password);

  // role is always USER here — public registration can never select ADMIN.
  const user = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name,
      email,
      passwordHash,
      role: 'USER',
      isActive: true,
      emailVerified: false,
      avatarUrl
    }
  });

  // The account isn't usable until the email OTP step confirms mailbox
  // ownership, so no session is started here — see POST /api/auth/otp/verify-email.
  await issueOtp(user.email, 'EMAIL_VERIFICATION').catch((err) => console.error(err));

  return NextResponse.json({ email: user.email }, { status: 201 });
}
