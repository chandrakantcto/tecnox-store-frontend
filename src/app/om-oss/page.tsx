import type { Metadata } from "next";
import bgImg from "@/assets/ref-hotell.jpg";
import { Brands } from "@/components/site/Brands";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TrustStats } from "@/components/site/TrustStats";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Om oss",
  description:
    "30 års erfaring med profesjonelt kjøkkenutstyr i Norge. Møt teamet og verdiene som driver oss.",
  openGraph: {
    title: "Om TECNOX — 30 års erfaring",
    description: "Faglig integritet, lokal tilstedeværelse og lange relasjoner. Det er TECNOX.",
  },
};

const VALUES = [
  {
    titleNb: "Faglig integritet",
    titleEn: "Professional integrity",
    descNb: "Vi anbefaler det utstyret vi selv ville valgt. Aldri det med høyest margin.",
    descEn: "We recommend the equipment we would choose ourselves, never what has the highest margin.",
  },
  {
    titleNb: "Lokal tilstedeværelse",
    titleEn: "Local presence",
    descNb: "Sertifiserte teknikere fra Tromsø til Kristiansand — ikke en sentral hotline.",
    descEn: "Certified technicians from Tromso to Kristiansand, not a centralized hotline.",
  },
  {
    titleNb: "Lange relasjoner",
    titleEn: "Long-term relationships",
    descNb: "Mange av kundene våre har vært med oss i over 20 år. Det forteller noe.",
    descEn: "Many of our customers have worked with us for more than 20 years. That says something.",
  },
];

const TIMELINE = [
  {
    year: "1995",
    textNb: "Etablert i Oslo som leverandør av storkjøkkenutstyr.",
    textEn: "Established in Oslo as a supplier of commercial kitchen equipment.",
  },
  {
    year: "2004",
    textNb: "Åpnet eget servicekontor i Bergen og Trondheim.",
    textEn: "Opened dedicated service offices in Bergen and Trondheim.",
  },
  {
    year: "2015",
    textNb: "Ble autorisert forhandler av Rational i Norge.",
    textEn: "Became an authorized Rational dealer in Norway.",
  },
  {
    year: "2024",
    textNb: "Over 5 000 produkter på lager — 30 års jubileum.",
    textEn: "Over 5,000 products in stock - 30th anniversary.",
  },
];

export default async function OmOssPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Om oss", "About us")}
        title={<>{tr(locale, "30 år med kompromissløst håndverk.", "30 years of uncompromising craftsmanship.")}</>}
        description={tr(
          locale,
          "TECNOX ble grunnlagt i 1995 med en enkel idé — at norske storkjøkken fortjener europeisk toppkvalitet, levert av folk som faktisk vet hva utstyret skal tåle.",
          "TECNOX was founded in 1995 with a simple idea: Norwegian commercial kitchens deserve top European quality delivered by people who understand real kitchen demands.",
        )}
        crumbs={[{ label: tr(locale, "Om oss", "About us") }]}
        bgImage={bgImg}
      />

      <section className="bg-[var(--color-stone)] section-pad">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl mb-14">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Verdier", "Values")}
              </span>
              <h2 className="display-h2 mt-5 text-[var(--color-ink)]">
                {tr(locale, "Det vi står for.", "What we stand for.")}
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <Reveal key={v.titleNb} delay={i * 0.1}>
                <div className="bg-white p-8 h-full border-t-2 border-[var(--color-copper)] rounded-[3px]">
                  <p className="text-[12px] font-mono text-[var(--color-copper)] tracking-[0.18em]">
                    /{String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-5 text-[20px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
                    {tr(locale, v.titleNb, v.titleEn)}
                  </h3>
                  <p className="mt-3 text-[14px] text-[var(--color-muted)] leading-[1.65]">
                    {tr(locale, v.descNb, v.descEn)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-dark-bg)] text-[var(--color-stone)] section-pad">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl mb-14">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Historie", "History")}
              </span>
              <h2 className="display-h2 mt-5 text-white">{tr(locale, "Tre tiår, én retning.", "Three decades, one direction.")}</h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-px bg-[var(--color-dark-border)] border border-[var(--color-dark-border)]">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.08}>
                <div className="bg-[var(--color-dark-bg)] p-8 h-full">
                  <p className="text-[36px] lg:text-[44px] font-bold text-[var(--color-copper)] tracking-[-0.03em] leading-none">
                    {t.year}
                  </p>
                  <p className="mt-5 text-[14px] text-[var(--color-dark-muted)] leading-[1.65]">
                    {tr(locale, t.textNb, t.textEn)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <TrustStats locale={locale} />
      <Brands locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
