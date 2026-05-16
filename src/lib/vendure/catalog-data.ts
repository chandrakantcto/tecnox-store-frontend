import { cache } from "react";
import type { Locale } from "@/lib/locale";
import type {
  CatalogProductCard,
  CategoriesListingPageCopy,
  CategoriesSectionCopy,
  HomepageCategoryTile,
  MegaMenuLocales,
  ProductsListingCatalogPayload,
  ProductsListingPageCopy,
  ProductsSectionPayload,
} from "@/lib/vendure/catalog-types";
import { GQL_NAV_COLLECTIONS, GQL_NAV_COLLECTIONS_KATEGORIER, GQL_SEARCH_PRODUCTS, VENDURE_SHOP_LIST_MAX_TAKE } from "@/lib/vendure/queries";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";
import {
  absoluteAssetUrl,
  formatNOKExclVatFromMinor,
  inferBrandFromSku,
  priceMinorFromHit,
  validateFlattenedCollectionCounts,
  validateNavCollectionsPayload,
  validateSearchPayload,
  type SearchHitRaw,
  type VCollectionNav,
} from "@/lib/vendure/normalize";
import { rollupVariantTotalsFromCounts, type DirectVariantCounts } from "@/lib/vendure/collection-variant-counts";
import { GQL_COLLECTION_COUNTS_PAGE } from "@/lib/vendure/collection-counts-query";
import { navCollectionsToMegaMains } from "@/lib/vendure/nav-tree";

const EMPTY_CATEGORIES_COPY: CategoriesSectionCopy = {
  eyebrow: null,
  heading: null,
  supportingText: null,
  emptyMessage: null,
  seeAllLinkLabel: null,
};

/** Shop API exposes Channel.customFields as an object when relation fields exist; values may also be locale JSON objects or translation rows parsed in `stringFromCfValue`. */
function stringFromCfValue(v: unknown, requestLocale: string): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  if (Array.isArray(v)) {
    type Row = { languageCode?: unknown; value?: unknown };
    const rows = v as Row[];
    const order = [...new Set([requestLocale, requestLocale === "en" ? "nb" : "en", "nb", "en"])];
    for (const code of order) {
      const hit = rows.find((r) => String(r.languageCode) === code);
      const val = typeof hit?.value === "string" ? hit.value.trim() : "";
      if (val) return val;
    }
    for (const r of rows) {
      const val = typeof r.value === "string" ? r.value.trim() : "";
      if (val) return val;
    }
    return null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const order = [...new Set([requestLocale, requestLocale === "en" ? "nb" : "en", "nb", "en"])];
    for (const code of order) {
      const val = o[code];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
    for (const k of Object.keys(o).sort()) {
      const val = o[k];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  return null;
}

function normalizeChannelCustomFieldsJson(cf: unknown): Record<string, unknown> | null {
  if (!cf || typeof cf === "function") return null;
  let raw: unknown = cf;
  if (typeof cf === "string") {
    try {
      raw = JSON.parse(cf) as unknown;
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

const EMPTY_LISTING_PAGE: CategoriesListingPageCopy = {
  heroLabel: null,
  heroTitle: null,
  heroDescription: null,
  heroBgImageSrc: null,
  metaTitle: null,
  metaDescription: null,
};

function normalizeMediaPath(p: string): string | null {
  const t = p.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return absoluteAssetUrl(t);
}

/** Channel JSON may embed `{ preview, source }`, a URL string, or minimal `{ id }` (ignored). */
function heroImageSrcFromCfValue(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return normalizeMediaPath(v);
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const p = typeof x.preview === "string" ? x.preview : typeof x.source === "string" ? x.source : "";
  const fromFields = normalizeMediaPath(p);
  if (fromFields) return fromFields;
  const inner = x.featuredAsset ?? x.asset;
  if (inner && typeof inner === "object") {
    const a = inner as Record<string, unknown>;
    const p2 = typeof a.preview === "string" ? a.preview : typeof a.source === "string" ? a.source : "";
    return normalizeMediaPath(p2);
  }
  return null;
}

function parseCategoriesListingPageCopy(
  activeChannel: unknown,
  requestLocale: string,
): CategoriesListingPageCopy {
  if (!activeChannel || typeof activeChannel !== "object") return { ...EMPTY_LISTING_PAGE };
  const cf = (activeChannel as Record<string, unknown>).customFields;
  const box = normalizeChannelCustomFieldsJson(cf);
  if (!box) return { ...EMPTY_LISTING_PAGE };
  const s = (key: string): string | null => stringFromCfValue(box[key], requestLocale);
  return {
    heroLabel: s("categoriesListingHeroLabel"),
    heroTitle: s("categoriesListingHeroTitle"),
    heroDescription: s("categoriesListingHeroDescription"),
    metaTitle: s("categoriesListingMetaTitle"),
    metaDescription: s("categoriesListingMetaDescription"),
    heroBgImageSrc: heroImageSrcFromCfValue(box["categoriesListingHeroImage"]),
  };
}

function parseProductsListingPageCopy(activeChannel: unknown, requestLocale: string): ProductsListingPageCopy {
  if (!activeChannel || typeof activeChannel !== "object") return { ...EMPTY_LISTING_PAGE };
  const cf = (activeChannel as Record<string, unknown>).customFields;
  const box = normalizeChannelCustomFieldsJson(cf);
  if (!box) return { ...EMPTY_LISTING_PAGE };
  const s = (key: string): string | null => stringFromCfValue(box[key], requestLocale);
  return {
    heroLabel: s("productsListingHeroLabel"),
    heroTitle: s("productsListingHeroTitle"),
    heroDescription: s("productsListingHeroDescription"),
    metaTitle: s("productsListingMetaTitle"),
    metaDescription: s("productsListingMetaDescription"),
    heroBgImageSrc: heroImageSrcFromCfValue(box["productsListingHeroImage"]),
  };
}

function parseCategoriesSectionCopy(activeChannel: unknown, requestLocale: string): CategoriesSectionCopy {
  if (!activeChannel || typeof activeChannel !== "object") return { ...EMPTY_CATEGORIES_COPY };
  const cf = (activeChannel as Record<string, unknown>).customFields;
  const box = normalizeChannelCustomFieldsJson(cf);
  if (!box) return { ...EMPTY_CATEGORIES_COPY };
  const s = (key: string): string | null => stringFromCfValue(box[key], requestLocale);
  return {
    eyebrow: s("homepageCategoriesEyebrow"),
    heading: s("homepageCategoriesHeading"),
    supportingText: s("homepageCategoriesSupportingText"),
    emptyMessage: s("homepageCategoriesEmptyMessage"),
    seeAllLinkLabel: s("homepageCategoriesSeeAllLabel"),
  };
}



const COLLECTION_COUNT_PAGE = VENDURE_SHOP_LIST_MAX_TAKE;

async function accumulateDirectVariantCounts(locale: string, firstBranch: unknown): Promise<Map<string, number>> {
  const merged = new Map<string, number>();
  const first = validateFlattenedCollectionCounts(firstBranch);
  first.map.forEach((v, k) => merged.set(k, v));

  let fetched = merged.size;
  const totalItems = first.totalItems;

  while (totalItems > 0 && fetched < totalItems) {
    const { data } = await vendureShopQuery<{
      storefrontCollectionCounts?: unknown;
    }>(GQL_COLLECTION_COUNTS_PAGE, { take: COLLECTION_COUNT_PAGE, skip: fetched }, locale);

    const chunk = validateFlattenedCollectionCounts(data?.storefrontCollectionCounts);
    if (chunk.map.size === 0) break;
    chunk.map.forEach((v, k) => merged.set(k, v));
    fetched += chunk.map.size;
    if (chunk.map.size < COLLECTION_COUNT_PAGE) break;
  }

  return merged;
}

function buildCollectionIdToRootSlug(roots: VCollectionNav[]): Map<string, string> {
  const m = new Map<string, string>();
  const attach = (node: VCollectionNav, rootSlug: string) => {
    m.set(node.id, rootSlug);
    for (const ch of node.children ?? []) attach(ch, rootSlug);
  };
  for (const r of roots) attach(r, r.slug);
  return m;
}

function rootSlugFromCollectionIds(hit: SearchHitRaw, idToRoot: Map<string, string>): string | null {
  for (const id of hit.collectionIds ?? []) {
    const slug = idToRoot.get(id);
    if (slug) return slug;
  }
  return null;
}

function specFromHit(hit: SearchHitRaw): string {
  const d = hit.description?.replace(/\s+/g, " ").trim() ?? "";
  if (!d) return "";
  return d.length > 88 ? `${d.slice(0, 85)}…` : d;
}

/** Map search price (with tax minor) → display string for ex VAT NOK minor (seed used ex VAT øre). */
function exVatMinorFromInclusive(minorInclusive: number | null): number | null {
  if (minorInclusive === null) return null;
  return Math.round(minorInclusive / 1.25);
}

function hitToCard(
  locale: Locale,
  hit: SearchHitRaw,
  idToRoot: Map<string, string>,
  slugToCategoryName: Map<string, string>,
): CatalogProductCard {
  const rootSlug =
    rootSlugFromCollectionIds(hit, idToRoot) ?? [...slugToCategoryName.keys()][0] ?? "";
  const categoryLabel = slugToCategoryName.get(rootSlug) ?? "—";

  const preview = hit.productAsset?.preview ?? "";
  const imgUrl =
    absoluteAssetUrl(preview) ??
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="#e8e4df" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b6760" font-family="sans-serif" font-size="18">TECNOX</text></svg>`,
    )}`;

  const minorInc = priceMinorFromHit(hit.priceWithTax);
  const minorEx = exVatMinorFromInclusive(minorInc);

  return {
    slug: hit.slug,
    name: hit.productName,
    brand: inferBrandFromSku(hit.sku),
    spec: specFromHit(hit),
    price: formatNOKExclVatFromMinor(locale, minorEx),
    priceNumeric: typeof minorEx === "number" ? minorEx : 0,
    category: categoryLabel,
    categorySlug: rootSlug,
    img: imgUrl,
    description: hit.description?.trim() ?? "",
  };
}

export function searchHitToCatalogCard(
  locale: Locale,
  hit: SearchHitRaw,
  idToRoot: Map<string, string>,
  slugToCategoryName: Map<string, string>,
): CatalogProductCard {
  return hitToCard(locale, hit, idToRoot, slugToCategoryName);
}

type NavRootsPayload = {
  roots: VCollectionNav[];
  categoriesSectionCopy: CategoriesSectionCopy;
  categoriesListingPage: CategoriesListingPageCopy;
  productsListingPage: ProductsListingPageCopy;
  directVariantCounts: DirectVariantCounts;
  error?: string | null;
};

async function assembleNavRootsFromShopData(
  locale: string,
  data: {
    collections?: unknown;
    activeChannel?: unknown;
    storefrontCollectionCounts?: unknown;
  } | null,
  error: string | null,
  includeProductsListingPage: boolean,
): Promise<NavRootsPayload> {
  const categoriesSectionCopy = parseCategoriesSectionCopy(data?.activeChannel, locale);
  const categoriesListingPage = parseCategoriesListingPageCopy(data?.activeChannel, locale);
  const productsListingPage = includeProductsListingPage
    ? parseProductsListingPageCopy(data?.activeChannel, locale)
    : { ...EMPTY_LISTING_PAGE };
  const directVariantCounts = await accumulateDirectVariantCounts(locale, data?.storefrontCollectionCounts);
  const validated = validateNavCollectionsPayload(data);
  const roots = validated == null ? [] : validated;

  return {
    roots,
    categoriesSectionCopy,
    categoriesListingPage,
    productsListingPage,
    directVariantCounts,
    error: error ?? null,
  };
}

export const fetchNavRoots = cache(async (locale: string): Promise<NavRootsPayload> => {
  const { data, error } = await vendureShopQuery<{
    collections?: unknown;
    activeChannel?: unknown;
    storefrontCollectionCounts?: unknown;
  }>(GQL_NAV_COLLECTIONS, undefined, locale);

  return assembleNavRootsFromShopData(locale, data, error, true);
});

/** Cached nav for `/kategorier` only: same tree + counts; smaller Channel fragment; no products-listing channel copy. */
const fetchNavRootsKategorierPage = cache(async (locale: string): Promise<NavRootsPayload> => {
  const { data, error } = await vendureShopQuery<{
    collections?: unknown;
    activeChannel?: unknown;
    storefrontCollectionCounts?: unknown;
  }>(GQL_NAV_COLLECTIONS_KATEGORIER, undefined, locale);

  return assembleNavRootsFromShopData(locale, data, error, false);
});

export type CategoriesPagePayload = {
  categories: HomepageCategoryTile[];
  categoriesSectionCopy: CategoriesSectionCopy;
  categoriesListingPage: CategoriesListingPageCopy;
  error?: string | null;
};

/** `/kategorier` — category grid + listing copy only (no global product search). */
export const getCategoriesPagePayload = cache(async (locale: Locale): Promise<CategoriesPagePayload> => {
  const lc = locale === "en" ? "en" : "nb";

  try {
    const { roots, error, categoriesSectionCopy, categoriesListingPage, directVariantCounts } =
      await fetchNavRootsKategorierPage(lc);

    if (!roots.length) {
      const { error: megaErr } = await getMegaMenuBothLocales();
      return {
        categories: [],
        categoriesSectionCopy,
        categoriesListingPage,
        error: megaErr ?? error,
      };
    }

    const categories: HomepageCategoryTile[] = roots.map((r) => {
      const preview = r.featuredAsset?.preview || r.featuredAsset?.source;
      return {
        slug: r.slug,
        name: r.name,
        count: rollupVariantTotalsFromCounts(r, directVariantCounts),
        href: `/produkter?cat=${encodeURIComponent(r.slug)}`,
        remoteImageSrc: absoluteAssetUrl(preview),
      };
    });

    return { categories, categoriesSectionCopy, categoriesListingPage, error };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      categories: [],
      categoriesSectionCopy: { ...EMPTY_CATEGORIES_COPY },
      categoriesListingPage: { ...EMPTY_LISTING_PAGE },
      error: msg,
    };
  }
});

/** Channel copy for /produkter hero + `<title>` (shares cached `fetchNavRoots` with the listing loader). */
export const getProductsListingPageCopy = cache(async (locale: Locale): Promise<ProductsListingPageCopy> => {
  const lc = locale === "en" ? "en" : "nb";
  try {
    const { productsListingPage } = await fetchNavRoots(lc);
    return productsListingPage;
  } catch {
    return { ...EMPTY_LISTING_PAGE };
  }
});

async function searchGrouped(locale: string, input: Record<string, unknown>) {
  return vendureShopQuery<unknown>(
    GQL_SEARCH_PRODUCTS,
    { input: { ...input, groupByProduct: true } },
    locale,
  );
}

export const getMegaMenuBothLocales = cache(async (): Promise<{ data: MegaMenuLocales; error?: string | null }> => {
  const [nbRaw, enRaw] = await Promise.all([fetchNavRoots("nb"), fetchNavRoots("en")]);
  const err = nbRaw.error ?? enRaw.error;
  const nbMega = nbRaw.roots.length ? navCollectionsToMegaMains(nbRaw.roots, nbRaw.directVariantCounts) : [];
  const enMega = enRaw.roots.length ? navCollectionsToMegaMains(enRaw.roots, enRaw.directVariantCounts) : [];

  return {
    data: { nb: nbMega, en: enMega.length ? enMega : nbMega },
    error: nbMega.length ? err : err ?? "[catalog] Empty collection tree — check Channel token & Shop API.",
  };
});

function sidebarProductCountsByRoot(
  hits: SearchHitRaw[],
  roots: VCollectionNav[],
  idToRoot: Map<string, string>,
): { all: number; bySlug: Record<string, number> } {
  const bySlug = Object.fromEntries(roots.map((r) => [r.slug, 0])) as Record<string, number>;
  for (const hit of hits) {
    const rs = rootSlugFromCollectionIds(hit, idToRoot);
    if (rs !== null && Object.prototype.hasOwnProperty.call(bySlug, rs)) {
      bySlug[rs] += 1;
    }
  }
  return { all: hits.length, bySlug };
}

async function accumulateSearch(locale: string, baseInput: Record<string, unknown>): Promise<{
  hits: SearchHitRaw[];
  error?: string | null;
}> {
  const hits: SearchHitRaw[] = [];
  const take = 100;
  let skip = 0;
  let total = 1000;
  let lastErr: string | null = null;

  while (skip < total && hits.length < 2000) {
    const { data, error } = await searchGrouped(locale, { ...baseInput, take, skip });
    if (error) lastErr = error;
    const { hits: batch, totalItems } = validateSearchPayload(data);
    total = totalItems || batch.length;
    hits.push(...batch);
    if (batch.length < take) break;
    skip += take;
    if (!batch.length) break;
  }
  return { hits, error: lastErr };
}

/** Shared global catalogue search for a locale (homepage + /produkter dedupe within one RSC pass). */
export const getGlobalProductSearchHits = cache((locale: string) => accumulateSearch(locale, {}));

export const getHomepageCatalogPayload = cache(
  async (locale: Locale): Promise<{
    categories: HomepageCategoryTile[];
    categoriesSectionCopy: CategoriesSectionCopy;
    categoriesListingPage: CategoriesListingPageCopy;
    productsBlock: ProductsSectionPayload;
    error?: string | null;
  }> => {
    const lc = locale === "en" ? "en" : "nb";

    try {
      const { roots, error, categoriesSectionCopy, categoriesListingPage, directVariantCounts } =
        await fetchNavRoots(lc);
      if (!roots.length) {
        const { error: megaErr } = await getMegaMenuBothLocales();
        return {
          categories: [],
          categoriesSectionCopy,
          categoriesListingPage,
          productsBlock: {
            filters: locale === "en" ? ["All"] : ["Alle"],
            filterSlugs: [null],
            products: [],
            error: megaErr ?? error ?? "[catalog] No collections returned.",
          },
          error: megaErr ?? error,
        };
      }

      const idToRoot = buildCollectionIdToRootSlug(roots);
      const slugToCategoryName = new Map(roots.map((r) => [r.slug, r.name] as const));

      const categories: HomepageCategoryTile[] = roots.map((r) => {
        const preview = r.featuredAsset?.preview || r.featuredAsset?.source;
        return {
          slug: r.slug,
          name: r.name,
          count: rollupVariantTotalsFromCounts(r, directVariantCounts),
          href: `/produkter?cat=${encodeURIComponent(r.slug)}`,
          remoteImageSrc: absoluteAssetUrl(preview),
        };
      });

      const labelAll = locale === "en" ? "All" : "Alle";

      /** Global search merges all catalogue rows for homepage grid */
      const allRes = await getGlobalProductSearchHits(lc);

      const products = allRes.hits.map((h) => hitToCard(locale, h, idToRoot, slugToCategoryName));

      const filters = [labelAll, ...roots.map((r) => r.name)];
      const filterSlugs = [null as string | null, ...roots.map((r) => r.slug)];

      return {
        categories,
        categoriesSectionCopy,
        categoriesListingPage,
        productsBlock: {
          filters,
          filterSlugs,
          products,
          error: allRes.error,
        },
        error,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        categories: [],
        categoriesSectionCopy: { ...EMPTY_CATEGORIES_COPY },
        categoriesListingPage: { ...EMPTY_LISTING_PAGE },
        productsBlock: {
          filters: locale === "en" ? ["All"] : ["Alle"],
          filterSlugs: [null],
          products: [],
          error: msg,
        },
        error: msg,
      };
    }
  },
);

export const getProductsListingCatalog = cache(
  async (locale: Locale, requestedCatSlug: string | null): Promise<ProductsListingCatalogPayload> => {
    const lc = locale === "en" ? "en" : "nb";
    const emptySection = (err?: string | null): ProductsSectionPayload => ({
      filters: locale === "en" ? ["All"] : ["Alle"],
      filterSlugs: [null],
      products: [],
      error: err ?? null,
    });

    try {
      const nav = await fetchNavRoots(lc);
      if (!nav.roots.length) {
        const { error: megaErr } = await getMegaMenuBothLocales();
        return {
          listing: nav.productsListingPage,
          validatedCatSlug: null,
          catalog: emptySection(megaErr ?? nav.error ?? "[catalog] No collections returned."),
        };
      }

      const allowed = new Set(nav.roots.map((r) => r.slug));
      const cat = requestedCatSlug?.trim();
      const activeRootSlug = cat && allowed.has(cat) ? cat : null;

      const idToRoot = buildCollectionIdToRootSlug(nav.roots);
      const slugToCategoryName = new Map(nav.roots.map((r) => [r.slug, r.name] as const));

      const global = await getGlobalProductSearchHits(lc);
      const sidebarCounts = sidebarProductCountsByRoot(global.hits, nav.roots, idToRoot);

      const visibleHits =
        activeRootSlug === null
          ? global.hits
          : global.hits.filter((h) => rootSlugFromCollectionIds(h, idToRoot) === activeRootSlug);

      const products = visibleHits.map((h) => hitToCard(locale, h, idToRoot, slugToCategoryName));
      const labelAll = locale === "en" ? "All" : "Alle";

      return {
        listing: nav.productsListingPage,
        validatedCatSlug: activeRootSlug,
        catalog: {
          filters: [labelAll, ...nav.roots.map((r) => r.name)],
          filterSlugs: [null as string | null, ...nav.roots.map((r) => r.slug)],
          products,
          filterSidebarCounts: sidebarCounts,
          error: global.error ?? nav.error ?? null,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        listing: { ...EMPTY_LISTING_PAGE },
        validatedCatSlug: null,
        catalog: emptySection(msg),
      };
    }
  },
);

export const getProductsPagePayload = cache(async (locale: Locale): Promise<ProductsSectionPayload> => {
  const { productsBlock } = await getHomepageCatalogPayload(locale);
  return productsBlock;
});

export type {
  HomepageCategoryTile,
  CatalogProductCard,
  CategoriesSectionCopy,
  CategoriesListingPageCopy,
  ProductsListingPageCopy,
  ProductsListingCatalogPayload,
  ProductsSectionPayload,
  MegaMenuLocales,
} from "./catalog-types";
