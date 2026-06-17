import type { Locale } from "@/lib/locale";
import { isLocale, pickLocale } from "@/lib/locale";
import {
  getCountryCodeFromRequest,
  getLocaleCookieFromRequest,
  localeFromCountryCode,
} from "@/lib/locale-country";

/**
 * Locale for emails and API handlers:
 * 1. Explicit locale from request body (active UI locale)
 * 2. Manual choice (`site-locale` cookie)
 * 3. Geo country (Norway → nb, other → en)
 * 4. Default nb
 */
export function resolveRequestLocale(request: Request, bodyLocale?: unknown): Locale {
  if (typeof bodyLocale === "string" && isLocale(bodyLocale)) return bodyLocale;

  const cookie = getLocaleCookieFromRequest(request);
  if (isLocale(cookie)) return cookie;

  const country = getCountryCodeFromRequest(request);
  return localeFromCountryCode(country);
}

/** @deprecated Use resolveRequestLocale — kept for existing imports. */
export function resolveEmailLocaleFromRequest(request: Request, bodyLocale?: unknown): Locale {
  return resolveRequestLocale(request, bodyLocale);
}

export function resolveBodyLocale(bodyLocale?: unknown): Locale {
  return pickLocale(typeof bodyLocale === "string" ? bodyLocale : undefined);
}
