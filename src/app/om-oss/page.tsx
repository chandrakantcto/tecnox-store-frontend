import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { OmOssView } from "@/components/site/OmOssView";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";

export const metadata: Metadata = {
  title: "Om oss",
  description:
    "30 års erfaring med profesjonelt kjøkkenutstyr i Norge. Møt teamet og verdiene som driver oss.",
  openGraph: {
    title: "Om TECNOX — 30 års erfaring",
    description: "Faglig integritet, lokal tilstedeværelse og lange relasjoner. Det er TECNOX.",
  },
};

export default async function OmOssPage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <OmOssView />
      <Footer locale={locale} />
    </main>
  );
}
