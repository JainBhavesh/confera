import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark-secondary' | 'dark-danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
}

// The "dark-*" variants are fixed, theme-independent colors for the always-dark in-call
// UI (meeting rooms, live broadcasts) — those screens stay dark regardless of the app's
// light/dark setting, so they can't use the token-driven `secondary`/`danger` variants.
const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50',
  secondary: 'bg-muted text-foreground hover:bg-border disabled:opacity-50',
  ghost: 'bg-transparent text-foreground hover:bg-muted disabled:opacity-50',
  danger: 'bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50',
  'dark-secondary': 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50',
  'dark-danger': 'bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50'
};

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
