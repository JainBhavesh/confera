import { ReactNode } from 'react';

// The call room is a standalone, full-viewport experience — anyone with a
// public invite link can land here without ever seeing the app shell, so it
// deliberately escapes the root layout's sticky header/Container instead of
// living inside them. `fixed inset-0` positions against the viewport
// regardless of DOM nesting, and z-50 sits above the header's z-30.
export default function MeetLayout({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-background">{children}</div>;
}
