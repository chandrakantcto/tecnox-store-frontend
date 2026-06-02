import type { Metadata } from "next";
import bgImg from "@/assets/ref-restaurant.jpg";
import { Footer } from "@/components/site/Footer";
import { LegalContent } from "@/components/site/LegalContent";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TERMS_SECTIONS } from "@/data/legalContent";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Vilkår",
  description:
    "Salgs- og leveringsvilkår for TECNOX AS — profesjonelt kjøkkenutstyr, levering, betaling, garanti og service.",
  openGraph: {
    title: "Vilkår — TECNOX",
    description: "Generelle vilkår for kjøp av storkjøkkenutstyr og tilhørende tjenester fra TECNOX.",
  },
};

export default async function VilkarPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Vilkår", "Terms")}
        title={<>{tr(locale, "Klare rammer for profesjonelle kjøp.", "Clear terms for professional purchases.")}</>}
        description={tr(
          locale,
          "Disse vilkårene gjelder når du kjøper utstyr, reservedeler eller tjenester fra TECNOX som næringsdrivende kunde.",
          "These terms apply when you purchase equipment, spare parts, or services from TECNOX as a business customer.",
        )}
        crumbs={[{ label: tr(locale, "Vilkår", "Terms") }]}
        bgImage={bgImg}
        locale={locale}
      />
      <LegalContent
        locale={locale}
        sections={TERMS_SECTIONS}
        lastUpdatedNb="Sist oppdatert: 1. juni 2026"
        lastUpdatedEn="Last updated: 1 June 2026"
      />
      <Footer locale={locale} />
    </main>
  );
}
