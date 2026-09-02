import { ReactNode } from 'react';

/**
 * Hover/focus tooltip for icon-only controls. Named group (group/tooltip)
 * so it never collides with an unrelated `group` a parent might already use.
 * Purely visual — the wrapped control should still carry its own aria-label.
 */
export function Tooltip({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
