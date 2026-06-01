import type { Metadata } from "next";
import bgImg from "@/assets/ref-hotell.jpg";
import { Footer } from "@/components/site/Footer";
import { LegalContent } from "@/components/site/LegalContent";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { COOKIES_SECTIONS } from "@/data/legalContent";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Informasjonskapsler",
  description:
    "Cookie-erklæring for tecnox.no — hvilke informasjonskapsler TECNOX bruker og hvordan du kan administrere dem.",
  openGraph: {
    title: "Informasjonskapsler — TECNOX",
    description: "Les om cookies på TECNOX nettsted og hvordan de brukes for funksjonalitet og statistikk.",
  },
};

export default async function InformasjonskapslerPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Informasjonskapsler", "Cookies")}
        title={<>{tr(locale, "Slik bruker vi cookies.", "How we use cookies.")}</>}
        description={tr(
          locale,
          "Vi bruker informasjonskapsler for at nettbutikken skal fungere, for å huske valgene dine og for å forbedre nettstedet.",
          "We use cookies to make the online store work, remember your choices, and improve the website.",
        )}
        crumbs={[{ label: tr(locale, "Informasjonskapsler", "Cookies") }]}
        bgImage={bgImg}
        locale={locale}
      />
      <LegalContent
        locale={locale}
        sections={COOKIES_SECTIONS}
        lastUpdatedNb="Sist oppdatert: 1. juni 2026"
        lastUpdatedEn="Last updated: 1 June 2026"
      />
      <Footer locale={locale} />
    </main>
  );
}
