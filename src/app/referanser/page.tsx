import type { Metadata } from "next";
import bgImg from "@/assets/ref-restaurant.jpg";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { References } from "@/components/site/References";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Referanser",
    titleEn: "References",
    descNb: "Et utvalg av virksomhetene som har valgt TECNOX som sin leverandør av profesjonelt kjøkkenutstyr.",
    descEn: "A selection of businesses that have chosen TECNOX as their professional kitchen equipment supplier.",
    ogTitleNb: "Referanser — TECNOX",
    ogTitleEn: "References — TECNOX",
    ogDescNb: "Kjøkken vi er stolte av — restaurant, hotell og kantine over hele Norge.",
    ogDescEn: "Kitchens we are proud of — restaurants, hotels and canteens across Norway.",
  });
}

export default async function ReferanserPage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
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
        locale={locale}
      />
      <References locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
