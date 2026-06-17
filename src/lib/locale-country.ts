import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/locale";

export const NORWAY_COUNTRY_CODE = "NO";

export function getCountryCodeFromHeaderValue(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  if (!code || code.length !== 2 || code === "XX" || code === "T1") return null;
  return code;
}

/** Reads geo country from common CDN / reverse-proxy headers. */
export function getCountryCodeFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get("cf-ipcountry"),
    headers.get("x-vercel-ip-country"),
    headers.get("x-country-code"),
    headers.get("cloudfront-viewer-country"),
  ];
  for (const raw of candidates) {
    const code = getCountryCodeFromHeaderValue(raw);
    if (code) return code;
  }
  return null;
}

export function getCountryCodeFromRequest(request: Request): string | null {
  return getCountryCodeFromHeaders(request.headers);
}

/** Default site/email locale when the user has not chosen a language manually. */
export function localeFromCountryCode(countryCode: string | null | undefined): Locale {
  if (countryCode?.toUpperCase() === NORWAY_COUNTRY_CODE) return "nb";
  if (countryCode) return "en";
  return DEFAULT_LOCALE;
}

export function getLocaleCookieFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${LOCALE_COOKIE}=`)) {
      return decodeURIComponent(trimmed.slice(`${LOCALE_COOKIE}=`.length));
    }
  }
  return null;
}
