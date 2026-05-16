import { NextResponse } from "next/server";
import { parseNewsletterEmailPayload, ValidationError } from "@/lib/storefront-forms/validate";
import { getVendureServerConfigOrNull } from "@/lib/vendure/env";
import { GQL_SUBSCRIBE_NEWSLETTER, type SubmitLeadResultJson } from "@/lib/vendure/storefront-forms-mutations";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";

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

  let email: string;
  try {
    email = parseNewsletterEmailPayload(raw);
  } catch (e) {
    const msg = e instanceof ValidationError ? e.message : "Invalid email";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const lc = typeof raw.locale === "string" && raw.locale.startsWith("en") ? "en" : "nb";

  const { data, error } = await vendureShopQuery<SubmitLeadResultJson>(
    GQL_SUBSCRIBE_NEWSLETTER,
    { email },
    lc,
  );

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }

  const res = data?.subscribeNewsletter;
  if (!res?.success) {
    return NextResponse.json(
      { ok: false, error: res?.message ?? "Subscription failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
