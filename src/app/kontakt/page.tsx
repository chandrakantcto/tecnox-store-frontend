import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { KontaktView } from "@/components/site/KontaktView";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";
import { localizedPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedPageMetadata({
    titleNb: "Kontakt oss",
    titleEn: "Contact us",
    descNb: "Ta kontakt med Tecno X — kontorer i Oslo, Bergen og Trondheim. Telefon 411 90 600, post@tecnox.no.",
    descEn: "Contact Tecno X — offices in Oslo, Bergen and Trondheim. Phone 411 90 600, post@tecnox.no.",
    ogTitleNb: "Kontakt Tecno X",
    ogTitleEn: "Contact Tecno X",
    ogDescNb: "Tre kontorer, sertifiserte teknikere over hele Norge. Vi svarer alltid innen 24 timer.",
    ogDescEn: "Three offices, certified technicians across Norway. We always respond within 24 hours.",
  });
}

export default async function KontaktPage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <KontaktView />
      <SiteFooter locale={locale} />
    </main>
  );
}
