"use client";

import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/locale";

/** Live locale from the header switch (LocaleProvider). */
export function useActiveLocale(): Locale {
  return useLocale().locale;
}
