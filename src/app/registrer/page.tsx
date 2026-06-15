import type { Metadata } from "next";
import { RegisterView } from "@/components/account/RegisterView";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Registrer",
    titleEn: "Register",
    descNb: "Opprett konto i TECNOX nettbutikk.",
    descEn: "Create an account in the TECNOX online store.",
  });
}

export default async function RegistrerPage() {
  const { data } = await getMegaMenuBothLocales();
  return <RegisterView megaMenuByLocale={data} />;
}
