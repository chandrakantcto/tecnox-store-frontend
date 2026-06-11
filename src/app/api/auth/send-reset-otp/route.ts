import { NextResponse } from "next/server";
import { createOtp } from "@/lib/auth/otp-store";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeAuthEmail(String(body.email || ""));
    const locale = resolveEmailLocaleFromRequest(request, body.locale);

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }

    const registered = await isCustomerEmailRegistered(email);
    if (registered === false) {
      return NextResponse.json({ success: false, error: "email_not_registered" }, { status: 400 });
    }

    const otp = createOtp(email, "password-reset");
    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);

    const mail = await sendTransactionalEmail({
      to: email,
      subject: getPasswordResetEmailSubject(locale),
      html: buildPasswordResetEmailHtml(otp, baseUrl, locale),
      text: buildPasswordResetEmailText(otp, locale),
    });

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json({
      success: true,
      emailSent: mail.sent,
      ...(isDev && !mail.sent ? { devOtp: otp } : {}),
    });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
