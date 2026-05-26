import type { Metadata } from "next";
import bgImg from "@/assets/ref-restaurant.jpg";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { References } from "@/components/site/References";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Referanser",
  description:
    "Et utvalg av virksomhetene som har valgt TECNOX som sin leverandør av profesjonelt kjøkkenutstyr.",
  openGraph: {
    title: "Referanser — TECNOX",
    description: "Kjøkken vi er stolte av — restaurant, hotell og kantine over hele Norge.",
  },
};

export default async function ReferanserPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Referanser", "References")}
        title={<>{tr(locale, "Kjøkken vi er stolte av.", "Kitchens we are proud of.")}</>}
        description={tr(
          locale,
          "Et utvalg av virksomhetene som har valgt oss som sin leverandør.",
          "A selection of businesses that have chosen us as their supplier.",
        )}
        crumbs={[{ label: tr(locale, "Referanser", "References") }]}
        bgImage={bgImg}
      />
      <References locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
