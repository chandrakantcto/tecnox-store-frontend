import { NextResponse } from "next/server";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import { isCustomerEmailRegistered } from "@/lib/auth/customer-email-lookup";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeAuthEmail(String(body.email || ""));

    if (!isValidEmail(email)) {
      return NextResponse.json({ registered: false, error: "invalid_email" }, { status: 400 });
    }

    const registered = await isCustomerEmailRegistered(email);
    return NextResponse.json({ registered: registered === true, lookupAvailable: registered !== null });
  } catch {
    return NextResponse.json({ registered: false, error: "server_error" }, { status: 500 });
  }
}
