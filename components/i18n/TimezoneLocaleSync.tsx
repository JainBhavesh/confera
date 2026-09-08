'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { LOCALE_AUTO_COOKIE_NAME } from '@/i18n/locales';
import { localeFromTimezone } from '@/i18n/timezoneLocale';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Renders nothing — on first mount, if this browser's language has never
// been explicitly chosen (confera_locale_auto === '1', set by middleware on
// first visit or by a previous run of this same check), refine the
// Accept-Language guess using the browser's IANA timezone, which is often a
// better signal for which EU country a visitor is actually in. Backs off
// permanently the moment a real choice is made via the language switcher.
export function TimezoneLocaleSync() {
  const router = useRouter();
  const locale = useLocale();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    try {
      if (readCookie(LOCALE_AUTO_COOKIE_NAME) !== '1') return;

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const guessed = localeFromTimezone(timeZone);
      if (!guessed || guessed === locale) return;

      fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: guessed, auto: true })
      })
        .then(() => router.refresh())
        .catch(() => {
          /* best-effort — leave the Accept-Language-negotiated locale in place */
        });
    } catch {
      /* Intl.DateTimeFormat or document.cookie unavailable — leave locale as-is */
    }
  }, [locale, router]);

  return null;
}
