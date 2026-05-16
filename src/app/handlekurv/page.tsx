import type { Metadata } from "next";
import { HandlekurvView } from "@/components/site/HandlekurvView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";

export const metadata: Metadata = {
  title: "Handlekurv",
  description:
    "Din aktive ordre fra Vendure vises her. Oppdater eller fullfør handelen på kassen når du er klar.",

};

export default async function HandlekurvPage() {
  const locale = await getServerLocale();
  const { data } = await getMegaMenuBothLocales();

  return <HandlekurvView locale={locale} megaMenuByLocale={data} />;
}
