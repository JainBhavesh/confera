import type { SVGProps } from 'react';

/**
 * Paper-airplane brand mark. Outline follows `currentColor` (set text color on
 * an ancestor to flip it for light/dark backgrounds); the wing fill is the
 * fixed brand red so it stays consistent regardless of theme.
 */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" {...props}>
      <path
        d="M184 16 L16 92 L58 140 L150 178 Z"
        fill="#EC3013"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M58 140 L118 152 L74 186 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M184 16 L118 152" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}
