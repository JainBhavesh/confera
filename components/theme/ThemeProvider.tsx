'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'confera-theme';

export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always starts as 'light' to match the server-rendered markup exactly (the server can't
  // know the client's stored/system preference). THEME_INIT_SCRIPT already applied the real
  // class to <html> before hydration, so this layout effect just syncs React's state to it —
  // synchronously, before the browser paints — to avoid a flash of the wrong toggle icon.
  const [theme, setThemeState] = useState<Theme>('light');

  useLayoutEffect(() => {
    setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode, etc.) — theme still applies for this session
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(() => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')), []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
