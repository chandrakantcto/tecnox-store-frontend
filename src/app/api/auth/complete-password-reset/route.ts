import { NextResponse } from "next/server";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import { validatePasswordComplexity } from "@/lib/auth/validate";
import { resolveEmailLocaleFromRequest } from "@/lib/email/email-locale";
import {
  buildPasswordChangedEmailHtml,
  buildPasswordChangedEmailText,
  getPasswordChangedEmailSubject,
} from "@/lib/email/password-changed-email-template";
import { getEmailBaseUrl } from "@/lib/email/registration-email-template";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";
import { GQL_FORCE_PASSWORD_RESET } from "@/lib/vendure/shop-auth-documents";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeAuthEmail(String(body.email || ""));
    const otp = String(body.otp || "").trim();
    const password = String(body.password || "");
    const locale = resolveEmailLocaleFromRequest(request, body.locale);

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, error: "invalid_otp" }, { status: 400 });
    }

    const passwordErr = validatePasswordComplexity(password, locale);
    if (passwordErr) {
      return NextResponse.json({ success: false, error: "password_invalid", message: passwordErr }, { status: 400 });
    }

    const cookieStr = request.headers.get("cookie") || "";
    const cookieMatch = cookieStr.match(/tecnox_pwd_reset=([^;]+)/);
    if (!cookieMatch) {
      return NextResponse.json({ success: false, error: "otp_invalid" }, { status: 400 });
    }

    const decodedCookie = decodeURIComponent(cookieMatch[1]);
    const [payload, signature] = decodedCookie.split("|");
    if (!payload || !signature) {
      return NextResponse.json({ success: false, error: "otp_invalid" }, { status: 400 });
    }

    const [cookieEmail, cookieOtp, expiresAtStr] = payload.split(":");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.FRONTEND_OTP_SECRET || "emida-super-secret-2026")
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ success: false, error: "otp_invalid" }, { status: 400 });
    }

    if (Date.now() > parseInt(expiresAtStr, 10)) {
      return NextResponse.json({ success: false, error: "otp_invalid" }, { status: 400 });
    }

    if (normalizeAuthEmail(cookieEmail) !== email || cookieOtp !== otp) {
      return NextResponse.json({ success: false, error: "otp_invalid" }, { status: 400 });
    }

    const secret = process.env.FRONTEND_OTP_SECRET?.trim() || "emida-super-secret-2026";
    const { data, error } = await vendureShopQuery<{ forcePasswordReset: boolean }>(
      GQL_FORCE_PASSWORD_RESET,
      { emailAddress: email, newPassword: password, secret },
      locale,
    );

    if (error || !data?.forcePasswordReset) {
      return NextResponse.json({ success: false, error: "reset_failed" }, { status: 400 });
    }

    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);
    void sendTransactionalEmail({
      to: email,
      subject: getPasswordChangedEmailSubject(locale),
      html: buildPasswordChangedEmailHtml(email, baseUrl, locale),
      text: buildPasswordChangedEmailText(email, locale),
    }).catch(() => undefined);

    const response = NextResponse.json({ success: true });
    response.headers.append(
      "Set-Cookie",
      "tecnox_pwd_reset=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
    );
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
