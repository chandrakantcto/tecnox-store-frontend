import type { Metadata } from "next";
import catHero from "@/assets/cat-kombi.jpg";
import { Brands } from "@/components/site/Brands";
import { Categories } from "@/components/site/Categories";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCategoriesPagePayload } from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

const FALLBACK_META_NB = {
  title: "Kategorier",
  description:
    "Bla gjennom alle kategorier av profesjonelt kjøkkenutstyr — fra kombidampere og induksjonstopper til kjølerom og bar.",
  ogDesc:
    "Alle kategorier av profesjonelt kjøkkenutstyr — kok, kjøling, oppvask, pizza, kaffe og mer.",
} as const;

const FALLBACK_META_EN = {
  title: "Categories",
  description:
    "Browse professional kitchen equipment by category — from combi ovens and induction to cold rooms and bar.",
  ogDesc: "Kitchen equipment ranges — cooking, refrigeration, warewashing, pizza, coffee and more.",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const catalog = await getCategoriesPagePayload(locale);
  const lp = catalog.categoriesListingPage;
  const fb = locale === "en" ? FALLBACK_META_EN : FALLBACK_META_NB;

  const title = lp.metaTitle?.trim() || fb.title;
  const description = lp.metaDescription?.trim() || fb.description;

  return {
    title,
    description,
    openGraph: {
      title: `${title} — TECNOX`,
      description: lp.metaDescription?.trim() || fb.ogDesc,
    },
  };
}

export default async function KategorierPage() {
  const locale = await getServerLocale();
  const catalog = await getCategoriesPagePayload(locale);
  const lp = catalog.categoriesListingPage;

  const heroLabel =
    lp.heroLabel?.trim() || tr(locale, "Kategorier", "Categories");
  const heroTitle =
    lp.heroTitle?.trim() ||
    tr(locale, "Bygg kjøkkenet — kategori for kategori.", "Build your kitchen - category by category.");
  const heroDescription =
    lp.heroDescription?.trim() ||
    tr(
      locale,
      "Hver kategori er kuratert av våre fagfolk. Vi fører kun utstyr vi vet holder mål i daglig profesjonell drift.",
      "Each category is curated by our specialists. We only stock equipment we know performs in professional day-to-day operation.",
    );
  const heroBg = lp.heroBgImageSrc?.trim()
    ? lp.heroBgImageSrc.trim()
    : catHero;

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={heroLabel}
        title={<>{heroTitle}</>}
        description={heroDescription}
        crumbs={[{ label: heroLabel }]}
        bgImage={heroBg}
      />
      <Categories
        showSeeAllLink={false}
        locale={locale}
        tiles={catalog.categories}
        categoriesCopy={catalog.categoriesSectionCopy}
        catalogError={catalog.error}
      />
      <Brands locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
