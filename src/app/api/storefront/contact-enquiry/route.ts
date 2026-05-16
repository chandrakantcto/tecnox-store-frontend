import { NextResponse } from "next/server";
import { getVendureServerConfigOrNull } from "@/lib/vendure/env";
import { GQL_SUBMIT_CONTACT_ENQUIRY, type SubmitLeadResultJson } from "@/lib/vendure/storefront-forms-mutations";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";
import { ValidationError, parseContactPayload } from "@/lib/storefront-forms/validate";

type Body = Record<string, unknown>;

export async function POST(req: Request) {
  if (!getVendureServerConfigOrNull()) {
    return NextResponse.json({ ok: false, error: "Vendor API is not configured on the server." }, { status: 503 });
  }

  let raw: Body;
  try {
    raw = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  let input;
  try {
    input = parseContactPayload(raw);
  } catch (e) {
    const msg = e instanceof ValidationError ? e.message : "Invalid payload";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const lc = typeof raw.locale === "string" && raw.locale.startsWith("en") ? "en" : "nb";

  const { data, error } = await vendureShopQuery<SubmitLeadResultJson>(
    GQL_SUBMIT_CONTACT_ENQUIRY,
    { input },
    lc,
  );

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }

  const res = data?.submitContactEnquiry;
  if (!res?.success) {
    return NextResponse.json(
      { ok: false, error: res?.message ?? "Submission failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
