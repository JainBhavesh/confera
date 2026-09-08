import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { localeSchema } from '@/lib/validation/schemas';
import { LOCALE_AUTO_COOKIE_NAME, LOCALE_COOKIE_NAME } from '@/i18n/locales';

// Deliberately not gated by requireUser() — logged-out visitors on public
// and auth pages need to be able to switch language too, not just members
// inside the authenticated app shell.
//
// `auto` distinguishes a machine guess (timezone detection) from a real
// user choice (the language switcher never sends it, so it defaults to
// false): an auto guess only ever touches the cookie, so it can keep
// adjusting itself on later visits and never pollutes the account's saved
// preference; an explicit choice is remembered both on this browser
// (confera_locale_auto flips to '0', so the guesser leaves it alone) and,
// for a signed-in user, in User.locale so it follows them to other devices.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = localeSchema.safeParse(body?.locale);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid locale.' }, { status: 400 });
  }
  const auto = body?.auto === true;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, parsed.data, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });
  cookieStore.set(LOCALE_AUTO_COOKIE_NAME, auto ? '1' : '0', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });

  if (!auto) {
    const user = await getCurrentUser();
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { locale: parsed.data } });
    }
  }

  return NextResponse.json({ locale: parsed.data, auto });
}
