import { SVGProps } from 'react';

export function ScreenShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 12.5V7m0 0-2.3 2.3M12 7l2.3 2.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="9" cy="8" r="3.2" fill="currentColor" />
      <path d="M3 20c0-3.5 2.7-6.2 6-6.2s6 2.7 6 6.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="17.5" cy="9" r="2.4" fill="currentColor" opacity="0.6" />
      <path d="M14.8 14.2c2.5.5 4.3 2.6 4.3 5.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="5" width="18" height="12" rx="4" fill="currentColor" />
      <path d="M8 17v4l5-4" fill="currentColor" />
    </svg>
  );
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="8" y="8" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3H5.5A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="18" cy="5" r="2.5" fill="currentColor" />
      <circle cx="6" cy="12" r="2.5" fill="currentColor" />
      <circle cx="18" cy="19" r="2.5" fill="currentColor" />
      <line x1="8.2" y1="10.8" x2="15.8" y2="6.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8.2" y1="13.2" x2="15.8" y2="17.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SignalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 18v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 18v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20.5 18V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LeaveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9.5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 7.5 21 12l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
