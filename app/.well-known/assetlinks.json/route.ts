import { NextResponse } from 'next/server';

// Served at https://<domain>/.well-known/assetlinks.json so Android trusts
// this domain to open the mobile app for matching links (App Links
// autoVerify) instead of Chrome. Android checks this at install time and
// re-checks periodically — it doesn't need to be fetched per-tap.
//
// TODO: replace <ANDROID_SHA256_FINGERPRINT> with the real signing
// certificate fingerprint(s). Get it with:
//   eas credentials              (if using EAS Build), or
//   keytool -list -v -keystore <your-release.keystore>
// then read the "SHA256:" line. Add one entry per signing key you use
// (e.g. debug key while testing, release key for production) — the array
// takes multiple fingerprints. Until a real fingerprint is set, Android
// will reject the mismatch and fall back to opening links in Chrome.
const ANDROID_PACKAGE = 'com.meetinspired.mobile';
const SHA256_CERT_FINGERPRINTS = ['<ANDROID_SHA256_FINGERPRINT>'];

export function GET() {
  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: SHA256_CERT_FINGERPRINTS,
      },
    },
  ]);
}
