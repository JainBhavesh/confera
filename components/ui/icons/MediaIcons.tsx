import { SVGProps } from 'react';

function SlashOverlay() {
  return <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
}

export function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="9" y="2.5" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M6 11c0 3.31 2.69 6 6 6s6-2.69 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="12" y1="17" x2="12" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="20.5" x2="16" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MicOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="9" y="2.5" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M6 11c0 3.31 2.69 6 6 6s6-2.69 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="12" y1="17" x2="12" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="20.5" x2="16" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <SlashOverlay />
    </svg>
  );
}

export function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2" y="6" width="14" height="12" rx="3" fill="currentColor" />
      <path d="M16 10.3 22 7v10l-6-3.3z" fill="currentColor" />
    </svg>
  );
}

export function CameraOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2" y="6" width="14" height="12" rx="3" fill="currentColor" />
      <path d="M16 10.3 22 7v10l-6-3.3z" fill="currentColor" />
      <SlashOverlay />
    </svg>
  );
}
