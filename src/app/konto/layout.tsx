import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Min konto",
    titleEn: "My account",
    descNb: "Kontooversikt, profil og ordrehistorikk.",
    descEn: "Account overview, profile and order history.",
  });
}

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const { data } = await getMegaMenuBothLocales();
  return <AccountShell megaMenuByLocale={data}>{children}</AccountShell>;
}