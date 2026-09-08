// The 24 official languages of the European Union.
export const locales = [
  'bg',
  'hr',
  'cs',
  'da',
  'nl',
  'en',
  'et',
  'fi',
  'fr',
  'de',
  'el',
  'hu',
  'ga',
  'it',
  'lv',
  'lt',
  'mt',
  'pl',
  'pt',
  'ro',
  'sk',
  'sl',
  'es',
  'sv'
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const LOCALE_COOKIE_NAME = 'confera_locale';

// '1' = the current LOCALE_COOKIE_NAME value was auto-detected (Accept-Language
// on the server, or the browser timezone on the client) and hasn't been
// confirmed by the user yet — safe to keep auto-adjusting. '0' = the user
// picked a language explicitly via the switcher (or it was restored from
// their saved account preference) — never auto-adjust it again.
export const LOCALE_AUTO_COOKIE_NAME = 'confera_locale_auto';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

// Native-language display names, shown in the language switcher.
export const LOCALE_LABELS: Record<Locale, string> = {
  bg: 'Български',
  hr: 'Hrvatski',
  cs: 'Čeština',
  da: 'Dansk',
  nl: 'Nederlands',
  en: 'English',
  et: 'Eesti',
  fi: 'Suomi',
  fr: 'Français',
  de: 'Deutsch',
  el: 'Ελληνικά',
  hu: 'Magyar',
  ga: 'Gaeilge',
  it: 'Italiano',
  lv: 'Latviešu',
  lt: 'Lietuvių',
  mt: 'Malti',
  pl: 'Polski',
  pt: 'Português',
  ro: 'Română',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  es: 'Español',
  sv: 'Svenska'
};
