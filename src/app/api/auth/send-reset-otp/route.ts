import { NextResponse } from "next/server";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import { isCustomerEmailRegistered } from "@/lib/auth/customer-email-lookup";
import { resolveEmailLocaleFromRequest } from "@/lib/email/email-locale";
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
  getPasswordResetEmailSubject,
} from "@/lib/email/password-reset-email-template";
import { getEmailBaseUrl } from "@/lib/email/registration-email-template";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeAuthEmail(String(body.email || ""));
    const locale = resolveEmailLocaleFromRequest(request, body.locale);

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }

    const registered = await isCustomerEmailRegistered(email);
    if (registered !== true) {
      return NextResponse.json({ success: false, error: "email_not_registered" }, { status: 400 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);

    const mail = await sendTransactionalEmail({
      to: email,
      subject: getPasswordResetEmailSubject(locale),
      html: buildPasswordResetEmailHtml(otp, baseUrl, locale),
      text: buildPasswordResetEmailText(otp, locale),
    });

    const isDev = process.env.NODE_ENV === "development";

    const response = NextResponse.json({
      success: true,
      emailSent: mail.sent,
      ...(isDev && !mail.sent ? { devOtp: otp } : {}),
    });

    const expiresAt = Date.now() + 15 * 60 * 1000;
    const payload = `${email}:${otp}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', process.env.FRONTEND_OTP_SECRET || 'emida-super-secret-2026').update(payload).digest('hex');

    response.cookies.set('tecnox_pwd_reset', `${payload}|${signature}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
