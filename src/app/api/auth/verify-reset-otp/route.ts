import { NextResponse } from "next/server";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeAuthEmail(String(body.email || ""));
    const otp = String(body.otp || "").trim();

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, error: "invalid_otp" }, { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
