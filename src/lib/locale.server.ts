import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

/** Storefront is Norwegian-only; language switcher is hidden. */
export async function getServerLocale(): Promise<Locale> {
  return DEFAULT_LOCALE;
}
