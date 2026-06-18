import { NextResponse } from "next/server";
import { getVendureServerConfigOrNull } from "@/lib/vendure/env";
import { GQL_SUBMIT_CONTACT_ENQUIRY, type SubmitLeadResultJson } from "@/lib/vendure/storefront-forms-mutations";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";
import { resolveRequestLocale } from "@/lib/email/email-locale";
import { ValidationError, parseContactPayload } from "@/lib/storefront-forms/validate";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import {
  buildContactEnquiryAdminHtml,
  buildContactEnquiryUserHtml,
  getContactEnquiryAdminSubject,
  getContactEnquiryUserSubject
} from "@/lib/email/contact-enquiry-email-template";
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

  let input;
  try {
    input = parseContactPayload(raw, locale);
  } catch (e) {
    const msg = e instanceof ValidationError ? e.message : "Invalid payload";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const lc = locale;

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

  // Send Emails
  const baseUrl = getEmailBaseUrl(new URL(req.url).origin);
  const adminEmail = process.env.SMTP_USERNAME?.trim() || "giteshrewathi@gmail.com";

  const emailData = {
    ...input,
    phone: input.phone ?? undefined,
    company: input.company ?? undefined,
  };

  await Promise.allSettled([
    // User Email
    sendTransactionalEmail({
      to: input.email,
      subject: getContactEnquiryUserSubject(locale),
      html: buildContactEnquiryUserHtml(emailData, baseUrl, locale),
    }),
    // Admin Email
    sendTransactionalEmail({
      to: adminEmail,
      subject: getContactEnquiryAdminSubject(locale),
      html: buildContactEnquiryAdminHtml(emailData, baseUrl, locale),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
