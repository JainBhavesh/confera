import { ReactNode } from 'react';

type Variant = 'neutral' | 'success' | 'danger' | 'muted';

const VARIANT_STYLES: Record<Variant, string> = {
  neutral: 'bg-muted text-foreground',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  danger: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
};

export function Badge({ variant = 'neutral', children }: { variant?: Variant; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${VARIANT_STYLES[variant]}`}>
      {children}
    </span>
  );
}
