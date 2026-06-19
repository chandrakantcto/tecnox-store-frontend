/** Client + API route validation (aligned with backend `storefront-leads` plugin). */

import { pickLocale, tr, type Locale } from "@/lib/locale";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX = {
  name: 120,
  company: 200,
  email: 254,
  phone: 40,
  message: 10_000,
  productSlug: 128,
  productName: 512,
} as const;

function resolveLocale(raw: Record<string, unknown>, localeInput?: string): Locale {
  if (localeInput) return pickLocale(localeInput);
  if (typeof raw.locale === "string") return pickLocale(raw.locale);
  return "nb";
}

function trimOrNull(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function requireString(
  v: unknown,
  max: number,
  labelNb: string,
  labelEn: string,
  locale: Locale,
): string {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  if (!s) throw new ValidationError(tr(locale, `${labelNb} er påkrevd.`, `${labelEn} is required.`));
  if (s.length > max) throw new ValidationError(tr(locale, `${labelNb} er for lang.`, `${labelEn} is too long.`));
  return s;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseContactPayload(raw: Record<string, unknown>, localeInput?: string): {
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string;
} {
  const locale = resolveLocale(raw, localeInput);
  const email = requireString(raw.email, MAX.email, "E-post", "Email", locale);
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError(tr(locale, "Vennligst oppgi en gyldig e-postadresse.", "Please enter a valid email address."));
  }
  return {
    name: requireString(raw.name, MAX.name, "Navn", "Name", locale),
    company: trimOrNull(raw.company, MAX.company),
    email,
    phone: trimOrNull(raw.phone, MAX.phone),
    message: requireString(raw.message, MAX.message, "Melding", "Message", locale),
  };
}

export function parseQuotePayload(
  raw: Record<string, unknown>,
  localeInput?: string,
): ReturnType<typeof parseContactPayload> & {
  productSlug: string | null;
  productName: string | null;
} {
  const base = parseContactPayload(raw, localeInput);
  const r = raw ?? {};
  return {
    ...base,
    productSlug: trimOrNull(r.productSlug, MAX.productSlug),
    productName: trimOrNull(r.productName, MAX.productName),
  };
}

/** Newsletter block: email only (normalized server-side). */
export function parseNewsletterEmailPayload(raw: Record<string, unknown>, localeInput?: string): string {
  const locale = resolveLocale(raw, localeInput);
  const email = requireString(raw.email, MAX.email, "E-post", "Email", locale);
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError(tr(locale, "Vennligst oppgi en gyldig e-postadresse.", "Please enter a valid email address."));
  }
  return email.trim();
}
