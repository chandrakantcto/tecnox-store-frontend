import type { Metadata } from "next";
import bgImg from "@/assets/ref-hotell.jpg";
import { Footer } from "@/components/site/Footer";
import { LegalContent } from "@/components/site/LegalContent";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { COOKIES_SECTIONS } from "@/data/legalContent";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Informasjonskapsler",
    titleEn: "Cookies",
    descNb: "Cookie-erklæring for tecnox.no — hvilke informasjonskapsler Tecno X bruker og hvordan du kan administrere dem.",
    descEn: "Cookie policy for tecnox.no — which cookies Tecno X uses and how you can manage them.",
    ogTitleNb: "Informasjonskapsler — Tecno X",
    ogTitleEn: "Cookies — Tecno X",
    ogDescNb: "Les om cookies på Tecno X nettsted og hvordan de brukes for funksjonalitet og statistikk.",
    ogDescEn: "Read about cookies on the Tecno X website and how they are used for functionality and analytics.",
  });
}

export default async function InformasjonskapslerPage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
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
