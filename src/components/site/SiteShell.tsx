import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { TopBar } from "@/components/site/TopBar";
import type { Locale } from "@/lib/locale";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";

export function SiteShell({
  children,
  locale = "nb",
  megaMenuByLocale,
}: {
  children: React.ReactNode;
  locale?: Locale;
  megaMenuByLocale?: MegaMenuLocales;
}) {
  return (
    <>
      <header className="sticky top-0 z-50">
        <TopBar locale={locale} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>
      {children}
      <Footer locale={locale} />
    </>
  );
}
