import type { Metadata } from "next";
import bgImg from "@/assets/ref-kantine.jpg";
import { Footer } from "@/components/site/Footer";
import { LegalContent } from "@/components/site/LegalContent";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PRIVACY_SECTIONS } from "@/data/legalContent";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Personvern",
  description:
    "Personvernerklæring for TECNOX AS — hvordan vi behandler personopplysninger ved kjøp, tilbud, service og bruk av nettstedet.",
  openGraph: {
    title: "Personvern — TECNOX",
    description: "Les hvordan TECNOX behandler personopplysninger i tråd med GDPR og norsk personvernlovgivning.",
  },
};

export default async function PersonvernPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Personvern", "Privacy")}
        title={<>{tr(locale, "Dine data. Vårt ansvar.", "Your data. Our responsibility.")}</>}
        description={tr(
          locale,
          "TECNOX behandler personopplysninger trygt og transparent — enten du bestiller utstyr, ber om tilbud eller kontakter oss for service.",
          "TECNOX processes personal data safely and transparently — whether you order equipment, request a quote, or contact us for service.",
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
      <Footer locale={locale} />
    </main>
  );
}
