const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured: "That sign-in option isn't set up yet.",
  oauth_failed: 'Something went wrong signing in. Please try again.',
  oauth_email_missing: "We couldn't get a verified email address from that account.",
  oauth_registration_disabled: 'New sign-ups are currently disabled.',
  oauth_account_disabled: 'This account has been disabled.',
  oauth_linked_to_other_provider: 'This email is already linked to a different sign-in method.'
};

export function getOAuthErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? 'Something went wrong signing in. Please try again.';
}
