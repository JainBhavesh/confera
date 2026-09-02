import { NextResponse } from 'next/server';
import { generateState, getAppBaseUrl, setStateCookie } from '@/lib/auth/oauthState';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${getAppBaseUrl()}/login?error=oauth_not_configured`);
  }

  const state = generateState();
  await setStateCookie('google', state);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${getAppBaseUrl()}/api/auth/oauth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(url.toString());
}
