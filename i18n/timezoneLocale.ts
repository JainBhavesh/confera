import { isLocale, type Locale } from './locales';

// Best-effort IANA timezone -> EU locale heuristic, used only to pick an
// initial language for a visitor who hasn't chosen one yet (see
// components/i18n/TimezoneLocaleSync.tsx). Deliberately covers only
// timezones that map unambiguously to one of our 24 locales — English-
// speaking and non-EU zones (America/*, Europe/London, Europe/Dublin, ...)
// are left unmapped so they fall through to the Accept-Language guess /
// default 'en' instead of a wrong guess.
const TIMEZONE_LOCALE: Record<string, Locale> = {
  'Europe/Sofia': 'bg',
  'Europe/Zagreb': 'hr',
  'Europe/Prague': 'cs',
  'Europe/Copenhagen': 'da',
  'Europe/Amsterdam': 'nl',
  'Europe/Brussels': 'nl',
  'Europe/Tallinn': 'et',
  'Europe/Helsinki': 'fi',
  'Europe/Mariehamn': 'fi',
  'Europe/Paris': 'fr',
  'Europe/Luxembourg': 'fr',
  'Europe/Berlin': 'de',
  'Europe/Vienna': 'de',
  'Europe/Busingen': 'de',
  'Europe/Athens': 'el',
  'Europe/Nicosia': 'el',
  'Europe/Budapest': 'hu',
  'Europe/Rome': 'it',
  'Europe/Riga': 'lv',
  'Europe/Vilnius': 'lt',
  'Europe/Malta': 'mt',
  'Europe/Warsaw': 'pl',
  'Europe/Lisbon': 'pt',
  'Atlantic/Azores': 'pt',
  'Atlantic/Madeira': 'pt',
  'Europe/Bucharest': 'ro',
  'Europe/Bratislava': 'sk',
  'Europe/Ljubljana': 'sl',
  'Europe/Madrid': 'es',
  'Africa/Ceuta': 'es',
  'Atlantic/Canary': 'es',
  'Europe/Stockholm': 'sv'
};

export function localeFromTimezone(timeZone: string | undefined | null): Locale | null {
  if (!timeZone) return null;
  const mapped = TIMEZONE_LOCALE[timeZone];
  return mapped && isLocale(mapped) ? mapped : null;
}
