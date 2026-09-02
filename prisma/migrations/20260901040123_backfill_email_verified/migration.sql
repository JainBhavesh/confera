-- Accounts created before the email-OTP feature predate email verification
-- entirely; treat them as already verified so existing users (including
-- seeded admins) aren't locked out of login. Verification only gates
-- accounts created after this point (public registration going forward).
UPDATE "User" SET "emailVerified" = true, "emailVerifiedAt" = COALESCE("emailVerifiedAt", CURRENT_TIMESTAMP)
WHERE "emailVerified" = false;
