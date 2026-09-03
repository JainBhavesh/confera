import type { Meeting } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { generateTempPassword, hashPassword } from '@/lib/auth/password';
import { sendMeetingInviteEmail } from '@/lib/email/meetingInviteEmail';

function baseUrl(): string {
  return process.env.APP_BASE_URL ?? 'http://localhost:3000';
}

/**
 * Invites each email to `meeting`: an existing account just gets the invite
 * email, an unrecognized one gets a fresh account (same org as the meeting)
 * with a random password, emailed once alongside the meeting details. Best
 * effort per address — one bad/unreachable email doesn't abort the rest.
 */
export async function inviteEmailsToMeeting(meeting: Meeting, hostName: string, emails: string[]): Promise<void> {
  const meetingUrl = `${baseUrl()}/meet/${meeting.id}`;
  const loginUrl = `${baseUrl()}/login`;

  for (const rawEmail of emails) {
    const email = rawEmail.trim().toLowerCase();
    if (!email) continue;

    try {
      let user = await prisma.user.findUnique({ where: { email } });
      let tempPassword: string | undefined;

      if (!user) {
        tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);
        user = await prisma.user.create({
          data: {
            organizationId: meeting.organizationId,
            name: email.split('@')[0],
            email,
            passwordHash,
            role: 'USER',
            isActive: true,
            // Invited-in accounts skip the self-service OTP step, same as
            // admin-created ones — the inviter is vouching for the email.
            emailVerified: true,
            emailVerifiedAt: new Date()
          }
        });
      }

      await prisma.meetingInvite.upsert({
        where: { meetingId_email: { meetingId: meeting.id, email } },
        create: { meetingId: meeting.id, email, userId: user.id },
        update: {}
      });

      await sendMeetingInviteEmail({
        to: email,
        hostName,
        meetingTitle: meeting.title,
        scheduledAt: meeting.scheduledAt,
        meetingUrl,
        loginUrl,
        tempPassword
      });
    } catch (err) {
      console.error(`[meeting-invite] failed to invite ${email}:`, err);
    }
  }
}
