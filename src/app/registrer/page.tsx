import type { Metadata } from "next";
import { RegisterView } from "@/components/account/RegisterView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";

export const metadata: Metadata = {
  title: "Registrer",
  description: "Opprett konto i TECNOX nettbutikk.",
};

export default async function RegistrerPage() {
  const { data } = await getMegaMenuBothLocales();
  return <RegisterView megaMenuByLocale={data} />;
}
