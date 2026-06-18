import { NextResponse } from "next/server";
import { resolveRequestLocale } from "@/lib/email/email-locale";
import { parseNewsletterEmailPayload, ValidationError } from "@/lib/storefront-forms/validate";
import { getVendureServerConfigOrNull } from "@/lib/vendure/env";
import { GQL_SUBSCRIBE_NEWSLETTER, type SubmitLeadResultJson } from "@/lib/vendure/storefront-forms-mutations";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { 
  buildNewsletterSubscribeAdminHtml, 
  buildNewsletterSubscribeUserHtml, 
  getNewsletterSubscribeAdminSubject, 
  getNewsletterSubscribeUserSubject 
} from "@/lib/email/newsletter-subscribe-email-template";
import { getEmailBaseUrl } from "@/lib/email/tecno-x-email-shell";

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

  const locale = resolveRequestLocale(req, raw.locale);

  let email: string;
  try {
    email = parseNewsletterEmailPayload(raw, locale);
  } catch (e) {
    const msg = e instanceof ValidationError ? e.message : "Invalid email";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const lc = locale;

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

  // Send Emails
  const baseUrl = getEmailBaseUrl(new URL(req.url).origin);
  const adminEmail = process.env.SMTP_USERNAME?.trim() || "giteshrewathi@gmail.com";

  await Promise.allSettled([
    // User Email
    sendTransactionalEmail({
      to: email,
      subject: getNewsletterSubscribeUserSubject(locale),
      html: buildNewsletterSubscribeUserHtml(baseUrl, locale),
    }),
    // Admin Email
    sendTransactionalEmail({
      to: adminEmail,
      subject: getNewsletterSubscribeAdminSubject(locale),
      html: buildNewsletterSubscribeAdminHtml({ email }, baseUrl, locale),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
