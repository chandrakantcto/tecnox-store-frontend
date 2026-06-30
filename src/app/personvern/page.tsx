import type { Metadata } from "next";
import bgImg from "@/assets/ref-kantine.jpg";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LegalContent } from "@/components/site/LegalContent";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PRIVACY_SECTIONS } from "@/data/legalContent";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Personvern",
    titleEn: "Privacy",
    descNb: "Personvernerklæring for Tecno X AS — hvordan vi behandler personopplysninger ved kjøp, tilbud, service og bruk av nettstedet.",
    descEn: "Privacy policy for Tecno X AS — how we process personal data for purchases, quotes, service and use of the website.",
    ogTitleNb: "Personvern — Tecno X",
    ogTitleEn: "Privacy — Tecno X",
    ogDescNb: "Les hvordan Tecno X behandler personopplysninger i tråd med GDPR og norsk personvernlovgivning.",
    ogDescEn: "Read how Tecno X processes personal data in accordance with GDPR and Norwegian privacy law.",
  });
}

export default async function PersonvernPage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Personvern", "Privacy")}
        title={<>{tr(locale, "Dine data. Vårt ansvar.", "Your data. Our responsibility.")}</>}
        description={tr(
          locale,
          "Tecno X behandler personopplysninger trygt og transparent — enten du bestiller utstyr, ber om tilbud eller kontakter oss for service.",
          "Tecno X processes personal data safely and transparently — whether you order equipment, request a quote, or contact us for service.",
        )}
        crumbs={[{ label: tr(locale, "Personvern", "Privacy") }]}
        bgImage={bgImg}
        locale={locale}
      />
      <LegalContent
        locale={locale}
        sections={PRIVACY_SECTIONS}
        lastUpdatedNb="Sist oppdatert: 1. juni 2026"
        lastUpdatedEn="Last updated: 1 June 2026"
      />
      <SiteFooter locale={locale} />
    </main>
  );
}
