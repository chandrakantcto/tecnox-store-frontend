import type { Metadata } from "next";
import heroImg from "@/assets/hero-combi.jpg";
import { Brands } from "@/components/site/Brands";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { Products } from "@/components/site/Products";
import { TopBar } from "@/components/site/TopBar";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Produkter",
  description:
    "Utforsk over 5 000 produkter for restaurant, kantine og storhusholdning — kombidampere, kjøling, oppvask, pizzautstyr og mer.",
};

export default async function ProdukterPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar locale={locale} />
        <MainNav />
      </header>
      <PageHero
        label={tr(locale, "Produkter", "Products")}
        title={<>{tr(locale, "Hele utvalget — på ett sted.", "The full range in one place.")}</>}
        description={tr(
          locale,
          "Filtrer på kategori, merke eller bruksområde. Alt utstyret holder europeisk profesjonell standard og leveres med full service over hele Norge.",
          "Filter by category, brand, or use case. All equipment meets European professional standards and is delivered with full service across Norway.",
        )}
        crumbs={[{ label: tr(locale, "Produkter", "Products") }]}
        bgImage={heroImg}
      />
      <Products withCategorySidebar locale={locale} />
      <Brands locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
