import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { consumeStateCookie, getAppBaseUrl } from '@/lib/auth/oauthState';
import { signInWithOAuth } from '@/services/oauth.service';

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function redirectToLogin(reason: string) {
  return NextResponse.redirect(`${getAppBaseUrl()}/login?error=${reason}`);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToLogin('oauth_not_configured');
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const stateValid = await consumeStateCookie('google', state);

  if (!code || !stateValid) {
    return redirectToLogin('oauth_failed');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${getAppBaseUrl()}/api/auth/oauth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokens.access_token) {
      console.error('[oauth/google] token exchange failed:', tokens.error, tokens.error_description);
      return redirectToLogin('oauth_failed');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (!profileResponse.ok) {
      return redirectToLogin('oauth_failed');
    }
    const profile = (await profileResponse.json()) as GoogleUserInfo;

    if (!profile.email || !profile.email_verified) {
      return redirectToLogin('oauth_email_missing');
    }

    const result = await signInWithOAuth({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name ?? profile.email,
      avatarSourceUrl: profile.picture
    });

    if (result.status === 'registration_disabled') return redirectToLogin('oauth_registration_disabled');
    if (result.status === 'account_disabled') return redirectToLogin('oauth_account_disabled');
    if (result.status === 'linked_to_other_provider') return redirectToLogin('oauth_linked_to_other_provider');

    await createSession(result.user.id);
    return NextResponse.redirect(`${getAppBaseUrl()}${result.user.role === 'ADMIN' ? '/admin' : '/dashboard'}`);
  } catch (err) {
    console.error('[oauth/google] callback failed:', err);
    return redirectToLogin('oauth_failed');
  }
}
