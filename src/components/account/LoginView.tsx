"use client";

import { Suspense } from "react";
import { AccountAuthView } from "@/components/account/AccountAuthView";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { useLocale } from "@/contexts/LocaleContext";
import { tr } from "@/lib/locale";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

export function LoginView({ megaMenuByLocale = EMPTY_MEGA }: { megaMenuByLocale?: MegaMenuLocales }) {
  const { locale } = useLocale();

  return (
    <Suspense
      fallback={
        <main className=" bg-[var(--color-stone)] p-8 text-center text-[var(--color-muted)]">
          {tr(locale, "Laster…", "Loading…")}
        </main>
      }
    >
      <AccountAuthView megaMenuByLocale={megaMenuByLocale} initialTab="login" />
    </Suspense>
  );
}
