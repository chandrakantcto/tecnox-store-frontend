"use client";

import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

export function Newsletter({ locale = "nb" }: { locale?: Locale }) {
  return (
    <section className="bg-white text-[var(--color-ink)] py-16 lg:py-20 border-t border-[var(--color-divider)]">
      <div className="container-x grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16">
        {/* Left */}
        <Reveal>
          <div className="bg-[var(--color-stone)] border border-[var(--color-divider)] rounded-[3px] p-8 lg:p-10 h-full flex flex-col justify-center">
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Faglig påfyll", "Professional insights")}
            </span>
            <h2 className="mt-4 text-[26px] lg:text-[34px] font-bold leading-[1.05] tracking-[-0.028em] text-[var(--color-ink)]">
              {tr(locale, "Hold deg oppdatert.", "Stay updated.")}
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-[1.65] text-[var(--color-muted)]">
              {tr(
                locale,
                "Nyheter om produkter, bransjenytt og eksklusive tilbud — direkte i innboksen.",
                "Product updates, industry news, and exclusive offers - straight to your inbox.",
              )}
            </p>

            <form
              className="mt-6 flex flex-col sm:flex-row gap-2 max-w-lg"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={tr(locale, "Din e-postadresse", "Your email address")}
                className="flex-1 bg-white text-[var(--color-ink)] placeholder:text-[var(--color-muted)] border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper)] focus:border-transparent"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                {tr(locale, "Meld meg på", "Subscribe")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-3 text-[11px] text-[var(--color-muted)]">
              {tr(locale, "Maks 2 e-poster per måned. Ingen spam.", "Max 2 emails per month. No spam.")}
            </p>
          </div>
        </Reveal>

        {/* Right — articles */}
        <Reveal delay={0.15}>
          <div className="flex flex-col gap-3 h-full">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] mb-1">
              {tr(locale, "Siste fra journalen", "Latest from the journal")}
            </h3>
            {[
              {
                tagNb: "Kjøpeguide",
                tagEn: "Buying guide",
                titleNb: "Slik velger du riktig kombidamper for din restaurant",
                titleEn: "How to choose the right combi oven for your restaurant",
                dateNb: "12. mars 2025",
                dateEn: "12 March 2025",
                read: "6 min",
              },
              {
                tagNb: "Trend",
                tagEn: "Trend",
                titleNb: "Energieffektivitet i storkjøkken — hva lønner seg i 2025?",
                titleEn: "Energy efficiency in commercial kitchens - what pays off in 2025?",
                dateNb: "28. februar 2025",
                dateEn: "28 February 2025",
                read: "4 min",
              },
            ].map((a) => (
              <article
                key={a.titleNb}
                className="group bg-white p-5 border border-[var(--color-divider)] hover:border-[var(--color-copper)] rounded-[3px] transition-colors cursor-pointer flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-copper)] font-semibold">
                    {tr(locale, a.tagNb, a.tagEn)}
                  </span>
                  <span className="text-[11px] text-[var(--color-muted)]">
                    {locale === "en" ? `${a.read} read` : `${a.read} lesetid`}
                  </span>
                </div>
                <h4 className="mt-3 text-[16px] font-bold text-[var(--color-ink)] leading-snug group-hover:text-[var(--color-copper)] transition-colors">
                  {tr(locale, a.titleNb, a.titleEn)}
                </h4>
                <p className="mt-auto pt-4 text-[12px] text-[var(--color-muted)] flex items-center justify-between">
                  <span>{tr(locale, a.dateNb, a.dateEn)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--color-copper)] transition-transform group-hover:translate-x-0.5" />
                </p>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
