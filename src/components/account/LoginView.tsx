"use client";

import { Suspense } from "react";
import { AccountAuthView } from "@/components/account/AccountAuthView";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

export function LoginView({ megaMenuByLocale = EMPTY_MEGA }: { megaMenuByLocale?: MegaMenuLocales }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--color-stone)] p-8 text-center text-[var(--color-muted)]">Loading…</main>
      }
    >
      <AccountAuthView megaMenuByLocale={megaMenuByLocale} initialTab="login" />
    </Suspense>
  );
}
