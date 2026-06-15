import { cookies, headers } from "next/headers";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/locale";
import { getCountryCodeFromHeaders, localeFromCountryCode } from "@/lib/locale-country";

/**
 * Active locale for SSR:
 * 1. Manual choice (`site-locale` cookie from header NB/EN switch)
 * 2. Geo country (Norway → nb, other → en)
 * 3. Default nb
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieVal)) return cookieVal;

  const headerStore = await headers();
  const country = getCountryCodeFromHeaders(headerStore);
  return localeFromCountryCode(country);
}
