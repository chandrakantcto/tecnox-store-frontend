import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SingleProductPage } from "@/components/site/SingleProductPage";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { getStorefrontProductDetail } from "@/lib/vendure/product-detail-data";
import { staticSrc } from "@/lib/static-asset";
import { getServerLocale } from "@/lib/locale.server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = await getServerLocale();
  const variantParam = typeof sp.v === "string" ? sp.v.trim() : "";
  const bundle = await getStorefrontProductDetail(locale, slug, variantParam || null);
  const product = bundle.product;
  if (!product) return { title: locale === "en" ? "Product" : "Produkt" };

  const desc = product.description.replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: product.name,
    description: desc,
    openGraph: { images: [{ url: staticSrc(product.img) }] },
  };
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = await getServerLocale();
  const variantParam = typeof sp.v === "string" ? sp.v.trim() : "";
  const { product, relatedProducts } = await getStorefrontProductDetail(locale, slug, variantParam || null);
  if (!product) notFound();

  const { data: megaMenuByLocale } = await getMegaMenuBothLocales();

  return (
    <SingleProductPage
      product={product}
      relatedProducts={relatedProducts}
      locale={locale}
      megaMenuByLocale={megaMenuByLocale}
    />
  );
}
