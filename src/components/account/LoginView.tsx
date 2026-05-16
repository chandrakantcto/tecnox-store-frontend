"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { TopBar } from "@/components/site/TopBar";
import { shopLoginEmailPassword } from "@/lib/auth/shop-session-auth";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { getClientLocale, type Locale, tr } from "@/lib/locale";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import heroImg from "@/assets/hero-combi.jpg";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

function LoginForm({ megaMenuByLocale }: { megaMenuByLocale: MegaMenuLocales }) {
  const router = useRouter();
  const sp = useSearchParams();
  const rawNext = sp.get("next") || "/konto";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/konto";
  const lc = getClientLocale();
  const { refresh } = useShopAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const r = await shopLoginEmailPassword(email, password, lc);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    await refresh();
    router.replace(next);
  };

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar locale={lc} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>
      <PageHero
        label={tr(lc, "Konto", "Account")}
        title={tr(lc, "Logg inn", "Sign in")}
        description={tr(
          lc,
          "Skriv inn e-post og passord knyttet til Vendure-kontoen.",
          "Enter the email and password for your storefront account.",
        )}
        crumbs={[{ label: tr(lc, "Logg inn", "Sign in") }]}
        bgImage={heroImg}
      />
      <section className="container-x section-pad max-w-xl">
        <form onSubmit={(e) => void submit(e)} className="space-y-5 rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
          <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {tr(lc, "E-post", "Email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px]"
            />
          </label>
          <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {tr(lc, "Passord", "Password")}
            <PasswordWithToggle
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
              showLabel={tr(lc, "Vis passord", "Show password")}
              hideLabel={tr(lc, "Skjul passord", "Hide password")}
              className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 pr-11 text-[14px]"
            />
          </label>
          {err ? <p className="rounded-[2px] border border-red-600/35 bg-white px-3 py-2 text-[13px] text-red-800">{err}</p> : null}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? tr(lc, "Logger inn …", "Signing in …") : tr(lc, "Logg inn", "Sign in")}
          </button>
          <p className="text-center text-[14px] text-[var(--color-muted)]">
            {tr(lc, "Ny kunde?", "New customer?")}{" "}
            <Link href="/registrer" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
              {tr(lc, "Opprett konto", "Create account")}
            </Link>
          </p>
        </form>
      </section>
      <Footer />
    </main>
  );
}

export function LoginView({ megaMenuByLocale = EMPTY_MEGA }: { megaMenuByLocale?: MegaMenuLocales }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--color-stone)] p-8 text-center text-[var(--color-muted)]">Loading…</main>
      }
    >
      <LoginForm megaMenuByLocale={megaMenuByLocale} />
    </Suspense>
  );
}
