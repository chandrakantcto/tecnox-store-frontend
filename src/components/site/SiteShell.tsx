import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { TopBar } from "@/components/site/TopBar";
import type { Locale } from "@/lib/locale";

export function SiteShell({
  children,
  locale = "nb",
}: {
  children: React.ReactNode;
  locale?: Locale;
}) {
  return (
    <>
      <header className="sticky top-0 z-50">
        <TopBar locale={locale} />
        <MainNav />
      </header>
      {children}
      <Footer locale={locale} />
    </>
  );
}
