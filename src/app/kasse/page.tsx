import type { Metadata } from "next";
import { KasseView } from "@/components/site/KasseView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Kasse",
    titleEn: "Checkout",
    descNb: "Fullfør bestillingen. Ordren gjennomføres via Vendure Shop API.",
    descEn: "Complete your order. The order is processed via the Vendure Shop API.",
  });
}

export default async function KassePage() {
  const locale = await getServerLocale();
  const { data } = await getMegaMenuBothLocales();

  return <KasseView locale={locale} megaMenuByLocale={data} />;
}
