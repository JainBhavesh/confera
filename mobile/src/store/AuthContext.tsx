import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../services/api/auth';
import i18n, { hasExplicitLanguageOverride, setAppLanguage } from '../i18n';
import { isLocale } from '../i18n/locales';
import type { PublicUser } from '../types';

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Applies the account's saved locale on login/refresh, but only when the
// user hasn't already picked a language explicitly on this device — an
// on-device choice always wins (see setAppLanguage's isExplicit flag).
async function syncAccountLocale(user: PublicUser | null) {
  if (!user || !isLocale(user.locale) || user.locale === i18n.language) return;
  if (await hasExplicitLanguageOverride()) return;
  await setAppLanguage(user.locale, false);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { user: current } = await authApi.getCurrentUser();
    setUser(current);
    await syncAccountLocale(current);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await authApi.login(email, password);
    setUser(loggedInUser);
    await syncAccountLocale(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
