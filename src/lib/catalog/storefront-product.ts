import type { StaticImageData } from "next/image";
import { staticSrc } from "@/lib/static-asset";

/** PDP + cart line display shape (filled only from Shop API payloads). */
export type ProductReview = {
  author: string;
  rating: number;
  title?: string | null;
  body: string;
  dateIso?: string | null;
};

export type LocalizedBulletBundle = {
  nb: string[];
  en: string[];
};

export type StorefrontVariantDetail = {
  id: string;
  sku: string;
  name: string;
  stockLevel: string;
  options: {
    id: string;
    code: string;
    name: string;
    groupId: string;
    groupCode: string;
    groupName: string;
  }[];
  priceLabelExVat: string;
  priceNumericExVat: number;
  /** Resolved absolute URL when available */
  imageSrc: string | null;
  /** Spec table for this variant (SKU + merged facets). */
  specs: { label: string; value: string }[];
};

/** PDP + listing card (listing omits richer optional fields). */
export type Product = {
  slug: string;
  name: string;
  brand: string;
  spec: string;
  price: string;
  priceNumeric: number;
  badge?: "BESTSELGER" | "NYHET";
  category: string;
  img: string | StaticImageData;
  /** Plain text excerpt; PDP may prefer descriptionHtml via optional field below */
  description: string;
  /** Raw HTML description when supplied by Shop API — shown in rich PDP block */
  descriptionHtml?: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  /** PDP: all selectable variants */
  variants?: StorefrontVariantDetail[];
  /** PDP: cheapest-variant id (SKU selection default). */
  defaultVariantId?: string | null;
  /** PDP: variant id used for this response (SSR / ?v=). */
  hydratedVariantId?: string | null;
  galleryImageUrls?: string[];
  reviews?: ProductReview[];
  /** Localized PDP bullet strings from Product.customFields JSON */
  serviceBulletsLocalized?: LocalizedBulletBundle | null;
  quoteBulletsLocalized?: LocalizedBulletBundle | null;
};

/** Persisted alongside cart rows so totals stay accurate offline from API. */
export type CartProductSnapshot = {
  productSlug: string;
  name: string;
  brand: string;
  spec: string;
  priceLabel: string;
  priceNumeric: number;
  imgSrc: string;
  variantId?: string;
  sku?: string;
  variantName?: string;
};

export function cartSnapshotFromProduct(
  product: Product,
  variant?: StorefrontVariantDetail | null,
): CartProductSnapshot {
  const v =
    variant === undefined
      ? product.variants?.length
        ? selectCheapestVariant(product.variants)
        : null
      : variant;
  const baseImg = typeof product.img === "string" ? product.img : staticSrc(product.img);
  const imgSrc = v?.imageSrc?.trim() ? v.imageSrc.trim() : baseImg;
  const specLine =
    v?.options?.length ? v.options.map((o) => o.name).join(" · ") : v?.sku ? `SKU ${v.sku}` : product.spec;
  return {
    productSlug: product.slug,
    name: product.name,
    brand: product.brand,
    spec: specLine,
    priceLabel: v ? v.priceLabelExVat : product.price,
    priceNumeric: v ? v.priceNumericExVat : product.priceNumeric,
    imgSrc,
    ...(v ? { variantId: v.id, sku: v.sku, variantName: v.name } : {}),
  };
}

/** Cart line identity: composite when a variant is selected */
export function cartLineKey(snapshot: Pick<CartProductSnapshot, "productSlug" | "variantId">): string {
  return snapshot.variantId ? `${snapshot.productSlug}::__v:${snapshot.variantId}` : snapshot.productSlug;
}

/** Default PDP / cart selection when no query param — lowest ex-VAT price. */
export function selectCheapestVariant(variants: StorefrontVariantDetail[]): StorefrontVariantDetail | null {
  if (!variants.length) return null;
  const ranked = [...variants].sort((a, b) => a.priceNumericExVat - b.priceNumericExVat);
  return ranked[0] ?? null;
}
