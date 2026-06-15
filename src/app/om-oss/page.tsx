import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { OmOssView } from "@/components/site/OmOssView";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Om oss",
    titleEn: "About us",
    descNb: "30 års erfaring med profesjonelt kjøkkenutstyr i Norge. Møt teamet og verdiene som driver oss.",
    descEn: "30 years of professional kitchen equipment in Norway. Meet the team and values that drive us.",
    ogTitleNb: "Om TECNOX — 30 års erfaring",
    ogTitleEn: "About TECNOX — 30 years of experience",
    ogDescNb: "Faglig integritet, lokal tilstedeværelse og lange relasjoner. Det er TECNOX.",
    ogDescEn: "Professional integrity, local presence and long-term relationships. That is TECNOX.",
  });
}

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
