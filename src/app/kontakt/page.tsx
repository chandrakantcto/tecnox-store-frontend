import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { KontaktView } from "@/components/site/KontaktView";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";

export const metadata: Metadata = {
  title: "Kontakt oss",
  description:
    "Ta kontakt med TECNOX — kontorer i Oslo, Bergen og Trondheim. Telefon 922 22 800, post@tecnox.no.",
  openGraph: {
    title: "Kontakt TECNOX",
    description: "Tre kontorer, sertifiserte teknikere over hele Norge. Vi svarer alltid innen 24 timer.",
  },
};

export default async function KontaktPage() {
  const locale = await getServerLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <KontaktView />
      <Footer locale={locale} />
    </main>
  );
}
