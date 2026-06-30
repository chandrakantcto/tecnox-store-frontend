import type { Metadata } from "next";
import bgImg from "@/assets/hero-combi.jpg";
import { Careers } from "@/components/site/Careers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Karriere",
    titleEn: "Careers",
    descNb: "Jobb hos Tecno X — servicetekniker, salg og åpen søknad. Bli med i et fagmiljø med 30 års erfaring i storkjøkken.",
    descEn: "Work at Tecno X — service technician, sales and open applications. Join a team with 30 years of large-scale kitchen experience.",
    ogTitleNb: "Karriere — Tecno X",
    ogTitleEn: "Careers — Tecno X",
    ogDescNb: "Ledige stillinger og åpen søknad. Kontakt oss på post@tecnox.no.",
    ogDescEn: "Open positions and open applications. Contact us at post@tecnox.no.",
  });
}

export default async function KarrierePage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
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
      <SiteFooter locale={locale} />
    </main>
  );
}
