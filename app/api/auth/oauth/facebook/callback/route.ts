import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { consumeStateCookie, getAppBaseUrl } from '@/lib/auth/oauthState';
import { signInWithOAuth } from '@/services/oauth.service';

interface FacebookTokenResponse {
  access_token: string;
  error?: { message: string };
}

interface FacebookProfile {
  id: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
  error?: { message: string };
}

function redirectToLogin(reason: string) {
  return NextResponse.redirect(`${getAppBaseUrl()}/login?error=${reason}`);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToLogin('oauth_not_configured');
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const stateValid = await consumeStateCookie('facebook', state);

  if (!code || !stateValid) {
    return redirectToLogin('oauth_failed');
  }

  try {
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', `${getAppBaseUrl()}/api/auth/oauth/facebook/callback`);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokens = (await tokenResponse.json()) as FacebookTokenResponse;
    if (!tokenResponse.ok || !tokens.access_token) {
      console.error('[oauth/facebook] token exchange failed:', tokens.error?.message);
      return redirectToLogin('oauth_failed');
    }

    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
    profileUrl.searchParams.set('access_token', tokens.access_token);

    const profileResponse = await fetch(profileUrl.toString());
    const profile = (await profileResponse.json()) as FacebookProfile;
    if (!profileResponse.ok || profile.error) {
      console.error('[oauth/facebook] profile fetch failed:', profile.error?.message);
      return redirectToLogin('oauth_failed');
    }

    // Facebook only returns `email` at all when the user has a verified one
    // and granted the permission — there's no separate "verified" flag to check.
    if (!profile.email) {
      return redirectToLogin('oauth_email_missing');
    }

    const result = await signInWithOAuth({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email,
      name: profile.name ?? profile.email,
      avatarSourceUrl: profile.picture?.data?.url
    });

    if (result.status === 'registration_disabled') return redirectToLogin('oauth_registration_disabled');
    if (result.status === 'account_disabled') return redirectToLogin('oauth_account_disabled');
    if (result.status === 'linked_to_other_provider') return redirectToLogin('oauth_linked_to_other_provider');

    await createSession(result.user.id);
    return NextResponse.redirect(`${getAppBaseUrl()}${result.user.role === 'ADMIN' ? '/admin' : '/dashboard'}`);
  } catch (err) {
    console.error('[oauth/facebook] callback failed:', err);
    return redirectToLogin('oauth_failed');
  }
}
