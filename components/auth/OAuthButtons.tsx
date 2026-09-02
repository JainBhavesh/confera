import { GoogleIcon, FacebookIcon } from '@/components/ui/icons/OAuthIcons';

/**
 * Plain <a> links, not buttons with onClick handlers — OAuth sign-in is a
 * full-page redirect to the provider's consent screen, not a fetch call.
 */
export function OAuthButtons() {
  return (
    <div className="space-y-2">
      <a
        href="/api/auth/oauth/google"
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </a>
      <a
        href="/api/auth/oauth/facebook"
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        <FacebookIcon className="h-5 w-5" />
        Continue with Facebook
      </a>
    </div>
  );
}
