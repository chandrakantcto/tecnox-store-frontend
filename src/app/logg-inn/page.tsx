import type { Metadata } from "next";
import { LoginView } from "@/components/account/LoginView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Logg inn",
    titleEn: "Sign in",
    descNb: "Logg inn på Tecno X nettbutikk.",
    descEn: "Sign in to the Tecno X online store.",
  });
}

export default async function LoggInnPage() {
  const { data } = await getMegaMenuBothLocales();
  return <LoginView megaMenuByLocale={data} />;
}
