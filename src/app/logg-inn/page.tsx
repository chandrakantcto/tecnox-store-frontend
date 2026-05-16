import type { Metadata } from "next";
import { LoginView } from "@/components/account/LoginView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";

export const metadata: Metadata = {
  title: "Logg inn",
  description: "Logg inn på TECNOX nettbutikk.",
};

export default async function LoggInnPage() {
  const { data } = await getMegaMenuBothLocales();
  return <LoginView megaMenuByLocale={data} />;
}
