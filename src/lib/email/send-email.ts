import nodemailer from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
import { getTecnoXEmailAttachments } from "@/lib/email/email-assets";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
}

function smtpUser(): string {
  return (
    process.env.SMTP_USER?.trim() ||
    process.env.SMTP_USERNAME?.trim() ||
    ""
  );
}

function smtpFrom(): string {
  const from = process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  if (from) return from;
  const user = smtpUser();
  return user ? `"TECNOX" <${user}>` : '"TECNOX" <post@tecnox.no>';
}

export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<{ sent: boolean; reason?: string }> {
  const user = smtpUser();
  const pass = process.env.SMTP_PASSWORD?.trim();
  if (!user || !pass) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });

    const attachments = [...getTecnoXEmailAttachments(), ...(input.attachments ?? [])];

    await transporter.sendMail({
      from: smtpFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments,
    });

    return { sent: true };
  } catch {
    return { sent: false, reason: "provider_error" };
  }
}
