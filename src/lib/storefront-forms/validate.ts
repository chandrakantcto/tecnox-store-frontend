/** Client + API route validation (aligned with backend `storefront-leads` plugin). */

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

function trimOrNull(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function requireString(v: unknown, max: number, field: string): string {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  if (!s) throw new ValidationError(`${field} is required`);
  if (s.length > max) throw new ValidationError(`${field} is too long`);
  return s;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseContactPayload(raw: Record<string, unknown>): {
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string;
} {
  const email = requireString(raw.email, MAX.email, "Email");
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError("Email is invalid");
  }
  return {
    name: requireString(raw.name, MAX.name, "Name"),
    company: trimOrNull(raw.company, MAX.company),
    email,
    phone: trimOrNull(raw.phone, MAX.phone),
    message: requireString(raw.message, MAX.message, "Message"),
  };
}

export function parseQuotePayload(raw: Record<string, unknown>): ReturnType<typeof parseContactPayload> & {
  productSlug: string | null;
  productName: string | null;
} {
  const base = parseContactPayload(raw);
  const r = raw ?? {};
  return {
    ...base,
    productSlug: trimOrNull(r.productSlug, MAX.productSlug),
    productName: trimOrNull(r.productName, MAX.productName),
  };
}

/** Newsletter block: email only (normalized server-side). */
export function parseNewsletterEmailPayload(raw: Record<string, unknown>): string {
  const email = requireString(raw.email, MAX.email, "Email");
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError("Email is invalid");
  }
  return email.trim();
}
