import type { Metadata } from "next";
import bgImg from "@/assets/hero-combi.jpg";
import { Careers } from "@/components/site/Careers";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Karriere",
  description:
    "Jobb hos TECNOX — servicetekniker, salg og åpen søknad. Bli med i et fagmiljø med 30 års erfaring i storkjøkken.",
  openGraph: {
    title: "Karriere — TECNOX",
    description: "Ledige stillinger og åpen søknad. Kontakt oss på post@tecnox.no.",
  },
};

export default async function KarrierePage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Karriere", "Careers")}
        title={<>{tr(locale, "Jobb med det beste utstyret i bransjen.", "Work with the best equipment in the industry.")}</>}
        description={tr(
          locale,
          "Vi bygger sterke team av teknikere og rådgivere — folk som vil levere kvalitet til norske storkjøkken.",
          "We build strong teams of technicians and advisors — people committed to quality for Norwegian commercial kitchens.",
        )}
        crumbs={[{ label: tr(locale, "Karriere", "Careers") }]}
        bgImage={bgImg}
        locale={locale}
      />
      <Careers locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
