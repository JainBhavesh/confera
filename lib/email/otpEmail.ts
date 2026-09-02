import type { OtpPurpose } from '@prisma/client';
import { sendMail } from '@/lib/email/mailer';

const COPY: Record<OtpPurpose, { subject: string; intro: string }> = {
  LOGIN: {
    subject: 'Your Confera login code',
    intro: 'Use this code to log in to your Confera account.'
  },
  EMAIL_VERIFICATION: {
    subject: 'Verify your Confera email',
    intro: 'Use this code to verify your email address and activate your Confera account.'
  },
  PASSWORD_RESET: {
    subject: 'Reset your Confera password',
    intro: "Use this code to reset your Confera password. If you didn't request this, your password is still safe — just ignore this email."
  }
};

export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<void> {
  const { subject, intro } = COPY[purpose];

  const text = `${intro}\n\nYour code: ${code}\n\nThis code expires in 10 minutes. If you didn't request it, you can safely ignore this email.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>${intro}</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">${code}</p>
      <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
    </div>
  `;

  await sendMail({ to: email, subject, html, text });
}
