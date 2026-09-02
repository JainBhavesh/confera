import { NextResponse } from 'next/server';
import { generateState, getAppBaseUrl, setStateCookie } from '@/lib/auth/oauthState';

export async function GET() {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${getAppBaseUrl()}/login?error=oauth_not_configured`);
  }

  const state = generateState();
  await setStateCookie('facebook', state);

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${getAppBaseUrl()}/api/auth/oauth/facebook/callback`);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'email,public_profile');

  return NextResponse.redirect(url.toString());
}
