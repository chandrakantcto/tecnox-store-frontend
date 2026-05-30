"use client";

import { AccountAuthView } from "@/components/account/AccountAuthView";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

export function RegisterView({ megaMenuByLocale = EMPTY_MEGA }: { megaMenuByLocale?: MegaMenuLocales }) {
  return <AccountAuthView megaMenuByLocale={megaMenuByLocale} initialTab="register" />;
}
