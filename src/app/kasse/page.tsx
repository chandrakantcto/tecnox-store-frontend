import type { Metadata } from "next";
import { KasseView } from "@/components/site/KasseView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";

export const metadata: Metadata = {
  title: "Kasse",
  description: "Fullfør bestillingen. Ordren gjennomføres via Vendure Shop API.",
};

export default async function KassePage() {
  const locale = await getServerLocale();
  const { data } = await getMegaMenuBothLocales();

  return <KasseView locale={locale} megaMenuByLocale={data} />;
}
