"use client";

import { useState } from "react";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { TopBar } from "@/components/site/TopBar";

import heroImg from "@/assets/hero-combi.jpg";

import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { getClientLocale, tr } from "@/lib/locale";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

export default function ForgotPasswordPage({
  megaMenuByLocale = EMPTY_MEGA,
}: {
  megaMenuByLocale?: MegaMenuLocales;
}) {
  const lc = getClientLocale();

  const [email, setEmail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log(email);
  };

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      
      <header className="sticky top-0 z-50">
        <TopBar locale={lc} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>

      <PageHero
        label={tr(lc, "Konto", "Account")}
        title={tr(lc, "Glemt passord", "Forgot Password")}
        description={tr(
          lc,
          "Tilbakestill passordet ditt.",
          "Reset your account password."
        )}
        crumbs={[
          {
            label: tr(lc, "Glemt passord", "Forgot Password"),
          },
        ]}
        bgImage={heroImg}
      />

      <section className="container-x section-pad max-w-xl">
        
        <form
          onSubmit={submit}
          className="space-y-5 rounded-[3px] border border-[var(--color-divider)] bg-white p-8"
        >
          
          <div>
            <h1 className="mb-2 text-2xl font-semibold text-[var(--color-ink)]">
              {tr(lc, "Glemt passord", "Forgot Password")}
            </h1>

            <p className="text-[14px] text-[var(--color-muted)]">
              {tr(
                lc,
                "Skriv inn e-postadressen din for å tilbakestille passordet.",
                "Enter your email address to reset your password."
              )}
            </p>
          </div>

          <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {tr(lc, "E-post", "Email")}

            <input
              type="email"
              required
              placeholder={tr(
                lc,
                "Skriv inn e-post",
                "Enter your email"
              )}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px] outline-none focus:border-[var(--color-copper)]"
            />
          </label>

          <button
            type="submit"
            className="btn-primary w-full disabled:opacity-60"
          >
            {tr(lc, "Send reset-lenke", "Send Reset Link")}
          </button>

          <p className="text-center text-[14px] text-[var(--color-muted)]">
            <Link
              href="/logg-inn"
              className="text-[var(--color-copper)] underline-offset-2 hover:underline"
            >
              {tr(lc, "Tilbake til innlogging", "Back to login")}
            </Link>
          </p>
        </form>
      </section>

      <Footer />
    </main>
  );
}