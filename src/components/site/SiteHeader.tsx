import { TopBar } from "@/components/site/TopBar";
import { MainNav } from "@/components/site/MainNav";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import type { Locale } from "@/lib/locale";

export async function SiteHeader({
  locale,
  initialMegaError,
}: {
  locale: Locale;
  /** When parent already fetched mega (avoid duplicate helper message) */
  initialMegaError?: string | null;
}) {
  const { data: megaMenuByLocale, error } = await getMegaMenuBothLocales();

  return (
    <header className="sticky top-0 z-50">
      <TopBar locale={locale} catalogError={error ?? initialMegaError} />
      <MainNav megaMenuByLocale={megaMenuByLocale} />
    </header>
  );
}
