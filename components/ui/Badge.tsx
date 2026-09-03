import { ReactNode } from 'react';

type Variant = 'neutral' | 'success' | 'danger' | 'muted' | 'outline';

const VARIANT_STYLES: Record<Variant, string> = {
  neutral: 'bg-muted text-foreground',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-accent text-accent-foreground',
  danger: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  outline: 'border border-primary text-primary'
};

export function Badge({ variant = 'neutral', children }: { variant?: Variant; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
