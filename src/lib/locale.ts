export const LOCALES = ["nb", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "nb";
export const LOCALE_COOKIE = "site-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && LOCALES.includes(value as Locale);
}

export function pickLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getClientLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  return pickLocale(value);
}

export function setClientLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function tr<T>(locale: Locale, nb: T, en: T): T {
  return locale === "en" ? en : nb;
}
