'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { isLocale, locales, LOCALE_LABELS, defaultLocale, type Locale } from '@/i18n/locales';

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const rawLocale = useLocale();
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = useTranslations('nav');
  const [pending, setPending] = useState(false);

  const handleChange = async (next: Locale) => {
    if (next === locale) return;
    setPending(true);
    try {
      // auto: false (the default) — an explicit pick here always wins over
      // Accept-Language/timezone guessing from now on, see TimezoneLocaleSync.
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next, auto: false })
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={
        className ??
        'relative inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition hover:bg-muted hover:text-foreground'
      }
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="pointer-events-none h-4 w-4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 20.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z" />
      </svg>
      {/* Full-size invisible overlay: keeps this a real, keyboard- and
          screen-reader-accessible <select> while showing only the globe
          icon above — a visible "English ⌄" here would out-compete the
          user's name for attention in a footer this narrow. */}
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as Locale)}
        aria-label={t('language')}
        title={LOCALE_LABELS[locale]}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-default"
      >
        {locales.map((code) => (
          <option key={code} value={code} className="bg-[#201e1d] text-[#f3f2f2]">
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
