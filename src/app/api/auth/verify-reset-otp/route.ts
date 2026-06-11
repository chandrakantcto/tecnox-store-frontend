import { NextResponse } from "next/server";
import { checkOtp } from "@/lib/auth/otp-store";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";

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
    if (!checkOtp(email, "password-reset", otp)) {
      return NextResponse.json({ success: false, error: "otp_invalid" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
