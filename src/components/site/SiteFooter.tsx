import { Footer } from "@/components/site/Footer";
import { getMegaMenuBothLocales, megaMenuToFooterRoots } from "@/lib/vendure/catalog-data";
import type { Locale } from "@/lib/locale";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const { data } = await getMegaMenuBothLocales();
  return <Footer locale={locale} rootCategories={megaMenuToFooterRoots(data)} />;
}
