import type { Metadata } from "next";
import catHero from "@/assets/cat-kombi.jpg";
import { Brands } from "@/components/site/Brands";
import { Categories } from "@/components/site/Categories";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { TopBar } from "@/components/site/TopBar";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Kategorier",
  description:
    "Bla gjennom alle kategorier av profesjonelt kjøkkenutstyr — fra kombidampere og induksjonstopper til kjølerom og bar.",
  openGraph: {
    title: "Kategorier — TECNOX",
    description:
      "Alle kategorier av profesjonelt kjøkkenutstyr — kok, kjøling, oppvask, pizza, kaffe og mer.",
  },
};

export default async function KategorierPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar locale={locale} />
        <MainNav />
      </header>
      <PageHero
        label={tr(locale, "Kategorier", "Categories")}
        title={<>{tr(locale, "Bygg kjøkkenet — kategori for kategori.", "Build your kitchen - category by category.")}</>}
        description={tr(
          locale,
          "Hver kategori er kuratert av våre fagfolk. Vi fører kun utstyr vi vet holder mål i daglig profesjonell drift.",
          "Each category is curated by our specialists. We only stock equipment we know performs in professional day-to-day operation.",
        )}
        crumbs={[{ label: tr(locale, "Kategorier", "Categories") }]}
        bgImage={catHero}
      />
      <Categories showSeeAllLink={false} locale={locale} />
      <Brands locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
