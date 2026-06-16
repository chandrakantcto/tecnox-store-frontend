import type { Metadata } from "next";
import bgImg from "@/assets/ref-restaurant.jpg";
import { Footer } from "@/components/site/Footer";
import { LegalContent } from "@/components/site/LegalContent";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TERMS_SECTIONS } from "@/data/legalContent";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Vilkår",
    titleEn: "Terms",
    descNb: "Salgs- og leveringsvilkår for Tecno X AS — profesjonelt kjøkkenutstyr, levering, betaling, garanti og service.",
    descEn: "Sales and delivery terms for Tecno X AS — professional kitchen equipment, delivery, payment, warranty and service.",
    ogTitleNb: "Vilkår — Tecno X",
    ogTitleEn: "Terms — Tecno X",
    ogDescNb: "Generelle vilkår for kjøp av storkjøkkenutstyr og tilhørende tjenester fra Tecno X.",
    ogDescEn: "General terms for purchasing large-scale kitchen equipment and related services from Tecno X.",
  });
}

export default async function VilkarPage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Vilkår", "Terms")}
        title={<>{tr(locale, "Klare rammer for profesjonelle kjøp.", "Clear terms for professional purchases.")}</>}
        description={tr(
          locale,
          "Disse vilkårene gjelder når du kjøper utstyr, reservedeler eller tjenester fra Tecno X som næringsdrivende kunde.",
          "These terms apply when you purchase equipment, spare parts, or services from Tecno X as a business customer.",
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
