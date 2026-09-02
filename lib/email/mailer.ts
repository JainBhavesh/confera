import nodemailer from 'nodemailer';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined
    });
  }
  return transporter;
}

export async function sendMail(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
  if (!process.env.SMTP_HOST) {
    // No SMTP configured (e.g. local dev without a mail provider set up yet) —
    // log instead of hanging/throwing, so the OTP flow stays testable.
    console.warn(`[mailer] SMTP_HOST not set; logging email instead of sending.\nTo: ${input.to}\nSubject: ${input.subject}\n\n${input.text}`);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text
  });
}
