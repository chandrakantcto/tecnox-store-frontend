import type { Metadata } from "next";
import { redirect } from "next/navigation";
import heroImg from "@/assets/hero-combi.jpg";
import { Brands } from "@/components/site/Brands";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { Products } from "@/components/site/Products";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  getProductsListingCatalog,
  getProductsListingPageCopy,
} from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

const FALLBACK_META_NB = {
  title: "Produkter",
  description:
    "Utforsk over 5 000 produkter for restaurant, kantine og storhusholdning — kombidampere, kjøling, oppvask, pizzautstyr og mer.",
  ogDesc:
    "Profesjonelt kjøkkenutstyr — kok, kjøling, oppvask, kombi, maskiner, servering og mer.",
} as const;

const FALLBACK_META_EN = {
  title: "Products",
  description:
    "Explore professional kitchen equipment for restaurants and catering — combi ovens, refrigeration, warewashing, pizza and more.",
  ogDesc:
    "Professional kitchen ranges — cooking, refrigeration, warewashing, combi ovens, machinery and more.",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const lp = await getProductsListingPageCopy(locale);
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

type PageProps = { searchParams?: Promise<{ cat?: string }> };

export default async function ProdukterPage(props: PageProps) {
  const locale = await getServerLocale();
  const sp = (await props.searchParams) ?? {};
  const rawCat = typeof sp.cat === "string" ? sp.cat.trim() : "";
  const cat = rawCat.length > 0 ? rawCat : null;
  const { listing: lp, catalog, validatedCatSlug } = await getProductsListingCatalog(locale, cat);
  if (cat !== null && validatedCatSlug !== cat) {
    redirect(validatedCatSlug ? `/produkter?cat=${encodeURIComponent(validatedCatSlug)}` : "/produkter");
  }

  const heroLabel = lp.heroLabel?.trim() || tr(locale, "Produkter", "Products");
  const heroTitle =
    lp.heroTitle?.trim() ||
    tr(locale, "Hele utvalget — på ett sted.", "The full range in one place.");
  const heroDescription =
    lp.heroDescription?.trim() ||
    tr(
      locale,
      "Filtrer på kategori, merke eller bruksområde. Alt utstyret holder europeisk profesjonell standard og leveres med full service over hele Norge.",
      "Filter by category, brand, or use case. All equipment meets European professional standards and is delivered with full service across Norway.",
    );
  const heroBg = lp.heroBgImageSrc?.trim() ? lp.heroBgImageSrc.trim() : heroImg;

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
      <Products withCategorySidebar locale={locale} catalog={catalog} initialCatSlug={validatedCatSlug} />
      <Brands locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
