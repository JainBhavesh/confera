import { sendMail } from '@/lib/email/mailer';

function formatScheduledAt(scheduledAt: Date | null): string {
  if (!scheduledAt) return 'as soon as the host starts it';
  return scheduledAt.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Invite to a scheduled meeting. When `tempPassword` is set, this doubles as
 * the new account's welcome email — the invitee had no Confera account, so
 * one was created for them (see services/meetingInvite.service.ts).
 */
export async function sendMeetingInviteEmail(input: {
  to: string;
  hostName: string;
  meetingTitle: string;
  scheduledAt: Date | null;
  meetingUrl: string;
  loginUrl: string;
  tempPassword?: string;
}): Promise<void> {
  const { to, hostName, meetingTitle, scheduledAt, meetingUrl, loginUrl, tempPassword } = input;
  const when = formatScheduledAt(scheduledAt);
  const subject = `${hostName} invited you to "${meetingTitle}"`;

  const text =
    `${hostName} invited you to a meeting on Confera.\n\n` +
    `${meetingTitle}\nWhen: ${when}\nJoin: ${meetingUrl}` +
    (tempPassword
      ? `\n\nWe've created a Confera account for you so you can join:\nEmail: ${to}\nTemporary password: ${tempPassword}\n\nSign in at ${loginUrl} — you can change this password afterward from your profile.`
      : '');

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>${hostName} invited you to a meeting on Confera.</p>
      <div style="margin: 20px 0; padding: 16px 20px; border: 1px solid #e2e2e2;">
        <p style="margin: 0 0 8px; font-size: 17px; font-weight: 700;">${meetingTitle}</p>
        <p style="margin: 0; color: #555; font-size: 14px;">${when}</p>
      </div>
      <p><a href="${meetingUrl}" style="display:inline-block; background:#ec3013; color:#fff; padding:10px 20px; text-decoration:none; font-weight:600;">Join meeting</a></p>
      ${
        tempPassword
          ? `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e2e2;">
               <p style="margin: 0 0 8px;">We've created a Confera account for you so you can join:</p>
               <p style="margin: 0;">Email: <strong>${to}</strong></p>
               <p style="margin: 0 0 8px;">Temporary password: <strong>${tempPassword}</strong></p>
               <p style="margin: 0; color: #666; font-size: 14px;">Sign in at <a href="${loginUrl}">${loginUrl}</a> — you can change this password afterward from your profile.</p>
             </div>`
          : ''
      }
    </div>
  `;

  await sendMail({ to, subject, html, text });
}
