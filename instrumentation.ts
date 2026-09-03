// Next.js server-start hook (https://nextjs.org/docs/app/guides/instrumentation).
// This file itself must stay free of Node-only imports — it's bundled for
// the Edge runtime too (this app has middleware), and the meeting sweep
// pulls in livekit-server-sdk/node:crypto, which the Edge bundle can't
// resolve. Keeping that code in a separate module behind this literal
// `NEXT_RUNTIME === 'nodejs'` check is the documented way to keep it out of
// the Edge bundle entirely.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}
