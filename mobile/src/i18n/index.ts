import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultLocale, isLocale, type Locale } from './locales';

import bg from './resources/bg.json';
import hr from './resources/hr.json';
import cs from './resources/cs.json';
import da from './resources/da.json';
import nl from './resources/nl.json';
import en from './resources/en.json';
import et from './resources/et.json';
import fi from './resources/fi.json';
import fr from './resources/fr.json';
import de from './resources/de.json';
import el from './resources/el.json';
import hu from './resources/hu.json';
import ga from './resources/ga.json';
import it from './resources/it.json';
import lv from './resources/lv.json';
import lt from './resources/lt.json';
import mt from './resources/mt.json';
import pl from './resources/pl.json';
import pt from './resources/pt.json';
import ro from './resources/ro.json';
import sk from './resources/sk.json';
import sl from './resources/sl.json';
import es from './resources/es.json';
import sv from './resources/sv.json';

// Explicit user choice, made via the ProfileModal language picker — once
// set, this always wins over the device/account-derived language on every
// future app launch (mirrors LOCALE_AUTO_COOKIE_NAME's semantics on web:
// an auto guess keeps adjusting itself, an explicit pick never does).
export const LANGUAGE_STORAGE_KEY = 'confera_language_override';

const resources = {
  bg: { translation: bg },
  hr: { translation: hr },
  cs: { translation: cs },
  da: { translation: da },
  nl: { translation: nl },
  en: { translation: en },
  et: { translation: et },
  fi: { translation: fi },
  fr: { translation: fr },
  de: { translation: de },
  el: { translation: el },
  hu: { translation: hu },
  ga: { translation: ga },
  it: { translation: it },
  lv: { translation: lv },
  lt: { translation: lt },
  mt: { translation: mt },
  pl: { translation: pl },
  pt: { translation: pt },
  ro: { translation: ro },
  sk: { translation: sk },
  sl: { translation: sl },
  es: { translation: es },
  sv: { translation: sv }
};

function detectDeviceLocale(): Locale {
  const [first] = Localization.getLocales();
  return isLocale(first?.languageCode) ? (first!.languageCode as Locale) : defaultLocale;
}

// Resolution order at cold start: (1) an explicit in-app choice persisted
// locally, (2) the device's language if it's one of the 24 we support,
// (3) English. The signed-in account's saved User.locale — when it differs
// from this and there's no local override yet — is applied afterwards by
// AuthContext once /api/auth/me resolves (that data isn't available this
// early, before the provider tree even mounts).
export async function initI18n(): Promise<void> {
  let initialLocale: Locale = defaultLocale;
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    initialLocale = isLocale(stored) ? stored : detectDeviceLocale();
  } catch {
    initialLocale = detectDeviceLocale();
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: defaultLocale,
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4'
  });
}

export async function hasExplicitLanguageOverride(): Promise<boolean> {
  try {
    return isLocale(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return false;
  }
}

// Called both from the explicit language picker (isExplicit=true) and from
// AuthContext syncing a signed-in user's saved preference (isExplicit=false
// — that path must never overwrite an on-device choice the user already made).
export async function setAppLanguage(locale: Locale, isExplicit: boolean): Promise<void> {
  await i18n.changeLanguage(locale);
  if (isExplicit) {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, locale).catch(() => {});
  }
}

export default i18n;
