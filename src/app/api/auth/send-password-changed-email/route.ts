import { NextResponse } from "next/server";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import { resolveEmailLocaleFromRequest } from "@/lib/email/email-locale";
import {
  buildPasswordChangedEmailHtml,
  buildPasswordChangedEmailText,
  getPasswordChangedEmailSubject,
} from "@/lib/email/password-changed-email-template";
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

    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);
    const mail = await sendTransactionalEmail({
      to: email,
      subject: getPasswordChangedEmailSubject(locale),
      html: buildPasswordChangedEmailHtml(email, baseUrl, locale),
      text: buildPasswordChangedEmailText(email, locale),
    });

    return NextResponse.json({ success: true, emailSent: mail.sent });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
