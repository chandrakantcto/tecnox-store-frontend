import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SingleProductPage } from "@/components/site/SingleProductPage";
import { getServerLocale } from "@/lib/locale.server";
import { staticSrc } from "@/lib/static-asset";
import { getLocalizedProduct, getProductBySlug, getRelatedProducts, PRODUCTS } from "@/lib/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const product = getProductBySlug(slug);
  if (!product) return { title: "Produkt" };
  const localized = getLocalizedProduct(product, locale);
  return {
    title: localized.name,
    description: localized.description.slice(0, 160),
    openGraph: { images: [{ url: staticSrc(product.img) }] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const localizedProduct = getLocalizedProduct(product, locale);
  const relatedProducts = getRelatedProducts(product).map((related) => getLocalizedProduct(related, locale));
  return <SingleProductPage product={localizedProduct} relatedProducts={relatedProducts} locale={locale} />;
}
