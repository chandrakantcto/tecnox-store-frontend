import { NextResponse } from "next/server";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import { resolveEmailLocaleFromRequest } from "@/lib/email/email-locale";
import {
  buildRegistrationEmailHtml,
  buildRegistrationEmailText,
  getEmailBaseUrl,
  getRegistrationEmailSubject,
} from "@/lib/email/registration-email-template";
import { sendTransactionalEmail } from "@/lib/email/send-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = normalizeAuthEmail(String(body.email || ""));
    const locale = resolveEmailLocaleFromRequest(request, body.locale);

    if (!firstName || !lastName) {
      return NextResponse.json({ success: false, error: "missing_name" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }

    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);
    const mail = await sendTransactionalEmail({
      to: email,
      subject: getRegistrationEmailSubject(locale),
      html: buildRegistrationEmailHtml({ firstName, lastName, email }, baseUrl, locale),
      text: buildRegistrationEmailText({ firstName, lastName, email }, locale),
    });

    return NextResponse.json({ success: true, emailSent: mail.sent });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
