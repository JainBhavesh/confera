import { ReactNode } from 'react';

// Mirrors app/meet/layout.tsx: a public livestream link must be watchable
// without ever hitting the authenticated app shell, so this deliberately
// escapes the root layout's sticky header/Container. `fixed inset-0`
// positions against the viewport regardless of DOM nesting, and z-50 sits
// above the header's z-30.
export default function LiveLayout({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-background">{children}</div>;
}
