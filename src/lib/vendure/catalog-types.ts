import type { MegaMain } from "@/data/megaMenu";
import type { Locale } from "@/lib/locale";
import type { StaticImageData } from "next/image";

export type MegaMenuLocales = Record<Locale, MegaMain[]>;

export type SidebarTreeNode = {
  id: string;
  slug: string;
  name: string;
  nameNb?: string;
  nameEn?: string;
  count: number;
  children: SidebarTreeNode[];
};

export type HomepageCategoryTile = {
  slug: string;
  name: string;
  /** Both locale labels for live header switch (optional on older payloads). */
  nameNb?: string;
  nameEn?: string;
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
  nameNb?: string;
  nameEn?: string;
  brand: string;
  spec: string;
  price: string;
  priceNumeric: number;
  category: string;
  categoryNb?: string;
  categoryEn?: string;
  categorySlug: string;
  badge?: string;
  img: string | StaticImageData;
  description: string;
  descriptionNb?: string;
  descriptionEn?: string;
};

export type ProductsSectionPayload = {
  filters: string[];
  /** Parallel NB/EN filter labels for client locale switch */
  filtersNb?: string[];
  filtersEn?: string[];
  filterSlugs: (string | null)[];
  products: CatalogProductCard[];
  subcategories?: HomepageCategoryTile[];
  sidebarTree?: SidebarTreeNode[];
  /** Root collection slug for sidebar highlight when `?cat=` is a nested collection */
  sidebarRootSlug?: string | null;
  /** When set (e.g. /produkter), sidebar counts reflect full catalogue; `products` may be filtered server-side */
  filterSidebarCounts?: {
    all: number;
    bySlug: Record<string, number>;
  };
  /** When set, `products` are filtered by this search term (e.g. `/produkter?q=`) */
  searchQuery?: string | null;
  error?: string | null;
};

/** SSR bundle for `/produkter`: Vendure channel copy + searchable product slice */
export type ProductsListingCatalogPayload = {
  listing: ProductsListingPageCopy;
  catalog: ProductsSectionPayload;
  /** Resolved root collection slug (`null` = all products); use for canonical `?cat=` */
  validatedCatSlug: string | null;
  /** Breadcrumb trail for active `?cat=` (root → … → selected), localized labels */
  categoryBreadcrumbs: CategoryBreadcrumb[];
};

export type CategoryBreadcrumb = {
  slug: string;
  label: string;
};
