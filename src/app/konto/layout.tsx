import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const { data } = await getMegaMenuBothLocales();
  return <AccountShell megaMenuByLocale={data}>{children}</AccountShell>;
}

export const metadata: Metadata = {
  title: "Min konto",
  description: "Kontooversikt, profil og ordrehistorikk.",
};
