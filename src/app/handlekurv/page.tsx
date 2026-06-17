import type { Metadata } from "next";
import { HandlekurvView } from "@/components/site/HandlekurvView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Handlekurv",
    titleEn: "Cart",
    descNb: "Din aktive ordre fra Vendure vises her. Oppdater eller fullfør handelen på kassen når du er klar.",
    descEn: "Your active Vendure order is shown here. Update items or proceed to checkout when ready.",
  });
}

export default async function HandlekurvPage() {
  const locale = await getServerLocale();
  const { data } = await getMegaMenuBothLocales();

  return <HandlekurvView locale={locale} megaMenuByLocale={data} />;
}
