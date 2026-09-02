import { NextResponse } from 'next/server';

// Served at https://<domain>/.well-known/apple-app-site-association (no
// extension, must be application/json) so iOS trusts this domain to open
// the mobile app for matching links instead of Safari. A route handler
// (rather than a public/ static file) guarantees the content-type, which
// Next's static file server can't be relied on to set correctly for an
// extensionless file.
//
// TODO: replace <APPLE_TEAM_ID> with the real Apple Developer Team ID
// (Apple Developer > Membership) once the iOS app has one. Until then this
// file is inert — iOS's verifier will reject the mismatched appID and fall
// back to opening links in Safari.
const APPLE_TEAM_ID = '<APPLE_TEAM_ID>';
const BUNDLE_ID = 'com.meetinspired.mobile';

export function GET() {
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: `${APPLE_TEAM_ID}.${BUNDLE_ID}`,
          paths: ['/meet/*', '/meeting/*'],
        },
      ],
    },
  });
}
