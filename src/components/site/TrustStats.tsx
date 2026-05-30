"use client";

import { Reveal } from "./Reveal";
import { CountUp } from "./CountUp";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const STATS = [
  {
    value: 5000,
    suffixNb: "+",
    suffixEn: "+",
    labelNb: "Produkter på lager",
    labelEn: "Products in stock",
    subNb: "Fra ledende europeiske merker",
    subEn: "From leading European brands",
  },
  {
    value: 30,
    suffixNb: " år",
    suffixEn: " yrs",
    labelNb: "I bransjen",
    labelEn: "In the industry",
    subNb: "Solid erfaring og fagkunnskap",
    subEn: "Solid experience and expertise",
  },
  {
    value: 19,
    suffixNb: " fylker",
    suffixEn: " counties",
    labelNb: "Levering & montering",
    labelEn: "Delivery & installation",
    subNb: "Fra Tromsø til Kristiansand",
    subEn: "From Tromsø to Kristiansand",
  },
  {
    value: 24,
    prefixNb: "< ",
    prefixEn: "< ",
    suffixNb: "t",
    suffixEn: "h",
    labelNb: "Responstid",
    labelEn: "Response time",
    subNb: "Rask tilbakemelding alltid",
    subEn: "Always quick feedback",
  },
];

export function TrustStats({ locale = "nb" }: { locale?: Locale }) {
  return (
    <section className="bg-[var(--color-stone)] py-16 lg:py-20 border-y border-[var(--color-divider)]">
      <div className="container-x">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--color-divider)] border border-[var(--color-divider)] bg-white rounded-[3px] overflow-hidden">
          {STATS.map((s, i) => (
            <Reveal key={s.labelNb} delay={i * 0.08}>
              <div className="px-5 lg:px-7 py-7 lg:py-8 h-full flex flex-col">
                <p className="text-[34px] lg:text-[44px] font-bold text-[var(--color-ink)] leading-none tracking-[-0.035em] tabular-nums">
                  <CountUp
                    end={s.value}
                    prefix={tr(locale, s.prefixNb ?? "", s.prefixEn ?? "")}
                    suffix={tr(locale, s.suffixNb, s.suffixEn)}
                  />
                </p>
                <p className="mt-3 text-[13px] text-[var(--color-ink)] font-semibold uppercase tracking-[0.06em]">
                  {tr(locale, s.labelNb, s.labelEn)}
                </p>
                <p className="mt-1.5 text-[12px] text-[var(--color-muted)] leading-relaxed">
                  {tr(locale, s.subNb, s.subEn)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <blockquote className="mt-10 text-center max-w-3xl mx-auto">
            <p className="text-[16px] lg:text-[19px] italic text-[var(--color-muted)] leading-[1.6]">
              {tr(
                locale,
                "«Vi er ikke bare en nettbutikk — vi er din faglige partner fra første tegning til ferdig kjøkken.»",
                '"We are not just an online store — we are your professional partner from first sketch to finished kitchen."',
              )}
            </p>
            <footer className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-copper)] font-semibold">
              — TECNOX
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
