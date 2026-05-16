import type { MegaMain } from "@/data/megaMenu";
import type { Locale } from "@/lib/locale";
import type { StaticImageData } from "next/image";

export type MegaMenuLocales = Record<Locale, MegaMain[]>;

export type HomepageCategoryTile = {
  slug: string;
  name: string;
  count: number;
  href: string;
  remoteImageSrc: string | null;
};

/** Homepage “Categories” block copy from Channel custom fields (`vendure-language-code` resolves strings). */
export type CategoriesSectionCopy = {
  eyebrow: string | null;
  heading: string | null;
  supportingText: string | null;
  emptyMessage: string | null;
  seeAllLinkLabel: string | null;
};

/** /kategorier hero + `<title>` / description from Channel custom fields */
export type CategoriesListingPageCopy = {
  heroLabel: string | null;
  heroTitle: string | null;
  heroDescription: string | null;
  heroBgImageSrc: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

/** /produkter listing hero + SEO (same shape as /kategorier listing; different Channel CF keys). */
export type ProductsListingPageCopy = CategoriesListingPageCopy;

export type CatalogProductCard = {
  slug: string;
  name: string;
  brand: string;
  spec: string;
  price: string;
  priceNumeric: number;
  category: string;
  categorySlug: string;
  badge?: string;
  img: string | StaticImageData;
  description: string;
};

export type ProductsSectionPayload = {
  filters: string[];
  filterSlugs: (string | null)[];
  products: CatalogProductCard[];
  /** When set (e.g. /produkter), sidebar counts reflect full catalogue; `products` may be filtered server-side */
  filterSidebarCounts?: {
    all: number;
    bySlug: Record<string, number>;
  };
  error?: string | null;
};

/** SSR bundle for `/produkter`: Vendure channel copy + searchable product slice */
export type ProductsListingCatalogPayload = {
  listing: ProductsListingPageCopy;
  catalog: ProductsSectionPayload;
  /** Resolved root collection slug (`null` = all products); use for canonical `?cat=` */
  validatedCatSlug: string | null;
};
