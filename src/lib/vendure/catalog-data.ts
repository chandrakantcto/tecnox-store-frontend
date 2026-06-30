import { cache } from "react";
import type { Locale } from "@/lib/locale";
import type {
  CatalogProductCard,
  CategoriesListingPageCopy,
  CategoriesSectionCopy,
  CategoryBreadcrumb,
  HomepageCategoryTile,
  MegaMenuLocales,
  ProductsListingCatalogPayload,
  ProductsListingPageCopy,
  ProductsSectionPayload,
  SidebarTreeNode,
} from "@/lib/vendure/catalog-types";
import { GQL_NAV_COLLECTIONS, GQL_NAV_COLLECTIONS_KATEGORIER, GQL_SEARCH_PRODUCTS, VENDURE_SHOP_LIST_MAX_TAKE } from "@/lib/vendure/queries";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";
import {
  absoluteAssetUrl,
  formatNOKExclVatFromMinor,
  inferBrandFromSku,
  priceMinorFromHit,
  dedupeNavRootsBySlug,
  validateFlattenedCollectionCounts,
  validateNavCollectionsPayload,
  validateSearchPayload,
  type SearchHitRaw,
  type VCollectionNav,
} from "@/lib/vendure/normalize";
import { rollupVariantTotalsFromCounts, type DirectVariantCounts } from "@/lib/vendure/collection-variant-counts";
import { GQL_COLLECTION_COUNTS_PAGE } from "@/lib/vendure/collection-counts-query";
import { navCollectionsToMegaMainsForLocale } from "@/lib/vendure/nav-tree";
import { rootCategoryLabelsForSlug } from "@/data/rootCategoryLabels";
import { resolveCollectionDisplayNames } from "@/data/collectionLabels";
import { resolveProductDescriptions, resolveProductDisplayNames } from "@/data/productLabels";

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

async function accumulateDirectVariantCounts(locale: string, firstBranch: unknown): Promise<Map<string, Set<string>>> {
  const merged = new Map<string, Set<string>>();
  // We compute the true product counts from the global search index instead of variant counts
  const dualSearch = await getGlobalProductSearchHitsDual();
  const baseHits = locale === "en" ? dualSearch.en : dualSearch.nb;
  
  for (const hit of baseHits) {
    if (hit.collectionIds) {
      const uniqueIds = new Set(hit.collectionIds);
      for (const id of uniqueIds) {
        if (!merged.has(id)) merged.set(id, new Set());
        merged.get(id)!.add(hit.productId);
      }
    }
  }
  
  return merged;
}

function rootsToCategoryTiles(
  roots: VCollectionNav[],
  directVariantCounts: DirectVariantCounts,
): HomepageCategoryTile[] {
  return dedupeNavRootsBySlug(roots).map((r) => {
    const preview = r.featuredAsset?.preview || r.featuredAsset?.source;
    return {
      slug: r.slug,
      name: r.name,
      count: rollupVariantTotalsFromCounts(r, directVariantCounts),
      href: `/produkter?cat=${encodeURIComponent(r.slug)}`,
      remoteImageSrc: absoluteAssetUrl(preview),
    };
  });
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

/** Map search price (with tax minor) → display string for incl. VAT NOK minor. */
function exVatMinorFromInclusive(minorInclusive: number | null): number | null {
  if (minorInclusive === null) return null;
  return Math.round(minorInclusive / 1.25);
}

function resolveRootCategoryNames(
  slug: string,
  nbNames: Map<string, string>,
  enNames: Map<string, string>,
  fallbackName: string,
): { nb: string; en: string } {
  const storeNb = nbNames.get(slug)?.trim() || "";
  const storeEn = enNames.get(slug)?.trim() || "";
  const fb = rootCategoryLabelsForSlug(slug);
  if (fb) {
    return {
      nb: fb.nameNb || storeNb || storeEn || fallbackName,
      en: fb.nameEn || storeEn || storeNb || fallbackName,
    };
  }
  return {
    nb: storeNb || storeEn || fallbackName,
    en: storeEn || storeNb || fallbackName,
  };
}

function previewFromNavNode(node: VCollectionNav | undefined): string {
  if (!node) return "";
  return (node.featuredAsset?.preview || node.featuredAsset?.source || "").trim();
}

/** Prefer featured image from any locale fetch so EN/NB switch does not drop admin assets. */
function mergedFeaturedPreview(
  slug: string,
  primary: VCollectionNav,
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
): string {
  const nbBySlug = new Map(dedupeNavRootsBySlug(nbRoots).map((r) => [r.slug, r] as const));
  const enBySlug = new Map(dedupeNavRootsBySlug(enRoots).map((r) => [r.slug, r] as const));
  return (
    previewFromNavNode(primary) ||
    previewFromNavNode(nbBySlug.get(slug)) ||
    previewFromNavNode(enBySlug.get(slug)) ||
    ""
  );
}

function hitToCard(
  locale: Locale,
  hit: SearchHitRaw,
  idToRoot: Map<string, string>,
  slugToCategoryNameNb: Map<string, string>,
  slugToCategoryNameEn: Map<string, string>,
  nbBySlug: Map<string, SearchHitRaw>,
  enBySlug: Map<string, SearchHitRaw>,
): CatalogProductCard {
  const localizedHit = applyLocaleToSearchHit(hit, locale, nbBySlug, enBySlug);
  const nbHit = nbBySlug.get(hit.slug);
  const enHit = enBySlug.get(hit.slug);
  const rootSlug =
    rootSlugFromCollectionIds(hit, idToRoot) ?? [...slugToCategoryNameNb.keys()][0] ?? "";
  const categoryNb = slugToCategoryNameNb.get(rootSlug) ?? "—";
  const categoryEn = slugToCategoryNameEn.get(rootSlug) ?? categoryNb;

  const preview = hit.productAsset?.preview ?? "";
  const imgUrl =
    absoluteAssetUrl(preview) ??
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="#e8e4df" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b6760" font-family="sans-serif" font-size="18">Tecno X</text></svg>`,
    )}`;

  const minorInc = priceMinorFromHit(hit.priceWithTax);

  const descriptionNbRaw = nbHit?.description?.trim() ?? hit.description?.trim() ?? "";
  const descriptionEnRaw =
    enHit?.description?.trim() ?? nbHit?.description?.trim() ?? hit.description?.trim() ?? "";
  const nameResolved = resolveProductDisplayNames(
    hit.slug,
    nbHit?.productName ?? hit.productName,
    enHit?.productName ?? nbHit?.productName ?? hit.productName,
    hit.productName,
  );
  const descResolved = resolveProductDescriptions(
    hit.slug,
    descriptionNbRaw,
    descriptionEnRaw,
    descriptionNbRaw || descriptionEnRaw,
  );

  return {
    slug: hit.slug,
    name: localizedHit.productName,
    nameNb: nameResolved.nb,
    nameEn: nameResolved.en,
    brand: inferBrandFromSku(hit.sku),
    spec: specFromHit(localizedHit),
    price: formatNOKExclVatFromMinor(locale, minorInc),
    priceNumeric: typeof minorInc === "number" ? minorInc : 0,
    category: locale === "en" ? categoryEn : categoryNb,
    categoryNb,
    categoryEn,
    categorySlug: rootSlug,
    img: imgUrl,
    description: localizedHit.description?.trim() ?? "",
    descriptionNb: descResolved.nb,
    descriptionEn: descResolved.en,
  };
}

export function searchHitToCatalogCard(
  locale: Locale,
  hit: SearchHitRaw,
  idToRoot: Map<string, string>,
  slugToCategoryNameNb: Map<string, string>,
  slugToCategoryNameEn: Map<string, string>,
  nbBySlug: Map<string, SearchHitRaw>,
  enBySlug: Map<string, SearchHitRaw>,
): CatalogProductCard {
  return hitToCard(locale, hit, idToRoot, slugToCategoryNameNb, slugToCategoryNameEn, nbBySlug, enBySlug);
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
    const [nav, navNb, navEn] = await Promise.all([
      fetchNavRootsKategorierPage(lc),
      fetchNavRootsKategorierPage("nb"),
      fetchNavRootsKategorierPage("en"),
    ]);
    const { roots, error, categoriesSectionCopy, categoriesListingPage, directVariantCounts } = nav;

    if (!roots.length) {
      const { error: megaErr } = await getMegaMenuBothLocales();
      return {
        categories: [],
        categoriesSectionCopy,
        categoriesListingPage,
        error: megaErr ?? error,
      };
    }

    const categories = localizedCategoryTiles(roots, locale, navNb.roots, navEn.roots, directVariantCounts);

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
  const structure = nbRaw.roots.length ? dedupeNavRootsBySlug(nbRaw.roots) : [];
  const nbMega = structure.length
    ? navCollectionsToMegaMainsForLocale(structure, nbRaw.directVariantCounts, nbRaw.roots, enRaw.roots, "nb")
    : [];
  const enMega = structure.length
    ? navCollectionsToMegaMainsForLocale(structure, nbRaw.directVariantCounts, nbRaw.roots, enRaw.roots, "en")
    : [];

  return {
    data: { nb: nbMega, en: enMega.length ? enMega : nbMega },
    error: nbMega.length ? err : err ?? "[catalog] Empty collection tree — check Channel token & Shop API.",
  };
});

function buildSidebarTree(
  nodes: VCollectionNav[],
  locale: Locale,
  nbNames: Map<string, string>,
  enNames: Map<string, string>,
  directVariantCounts: DirectVariantCounts,
): SidebarTreeNode[] {
  return nodes.map((node) => {
    const storeNb = nbNames.get(node.slug) || node.name;
    const storeEn = enNames.get(node.slug) || storeNb;
    const { nb, en } = resolveCollectionDisplayNames(node.slug, storeNb, storeEn, node.name);
    const name = locale === "en" ? en : nb;
    
    return {
      id: node.id,
      slug: node.slug,
      name,
      nameNb: nb,
      nameEn: en,
      count: (node.children ?? []).length,
      children: node.children ? buildSidebarTree(node.children, locale, nbNames, enNames, directVariantCounts) : [],
    };
  });
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

/** Both locales for product search — merge display fields without changing catalogue structure. */
export const getGlobalProductSearchHitsDual = cache(async () => {
  const [nb, en] = await Promise.all([getGlobalProductSearchHits("nb"), getGlobalProductSearchHits("en")]);
  return {
    nb: nb.hits,
    en: en.hits,
    error: nb.error ?? en.error ?? null,
  };
});

function searchHitsBySlug(hits: SearchHitRaw[]): Map<string, SearchHitRaw> {
  return new Map(hits.map((h) => [h.slug, h]));
}

/** Overlay productName/description from the active locale's search index, with cross-locale fallback. */
export function applyLocaleToSearchHit(
  hit: SearchHitRaw,
  locale: Locale,
  nbBySlug: Map<string, SearchHitRaw>,
  enBySlug: Map<string, SearchHitRaw>,
): SearchHitRaw {
  const primary = locale === "en" ? enBySlug.get(hit.slug) : nbBySlug.get(hit.slug);
  const fallback = locale === "en" ? nbBySlug.get(hit.slug) : enBySlug.get(hit.slug);
  const pick = primary ?? hit;
  return {
    ...hit,
    productName: pick.productName || fallback?.productName || hit.productName,
    description: pick.description ?? fallback?.description ?? hit.description,
  };
}

function categoryNameMapForLocale(
  displayRoots: VCollectionNav[],
  locale: Locale,
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
): Map<string, string> {
  const nbNames = new Map(dedupeNavRootsBySlug(nbRoots).map((r) => [r.slug, r.name] as const));
  const enNames = new Map(dedupeNavRootsBySlug(enRoots).map((r) => [r.slug, r.name] as const));
  return new Map(
    displayRoots.map((r) => {
      const { nb, en } = resolveRootCategoryNames(r.slug, nbNames, enNames, r.name);
      return [r.slug, locale === "en" ? en : nb] as const;
    }),
  );
}

function categoryNameMapsBoth(
  displayRoots: VCollectionNav[],
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
): { nb: Map<string, string>; en: Map<string, string> } {
  const nbNames = new Map(dedupeNavRootsBySlug(nbRoots).map((r) => [r.slug, r.name] as const));
  const enNames = new Map(dedupeNavRootsBySlug(enRoots).map((r) => [r.slug, r.name] as const));
  const nb = new Map<string, string>();
  const en = new Map<string, string>();
  for (const r of displayRoots) {
    const resolved = resolveRootCategoryNames(r.slug, nbNames, enNames, r.name);
    nb.set(r.slug, resolved.nb);
    en.set(r.slug, resolved.en);
  }
  return { nb, en };
}

function localizedCategoryTiles(
  roots: VCollectionNav[],
  locale: Locale,
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
  directVariantCounts: DirectVariantCounts,
): HomepageCategoryTile[] {
  const displayRoots = dedupeNavRootsBySlug(roots);
  const nbNames = new Map(dedupeNavRootsBySlug(nbRoots).map((r) => [r.slug, r.name] as const));
  const enNames = new Map(dedupeNavRootsBySlug(enRoots).map((r) => [r.slug, r.name] as const));
  return displayRoots.map((r) => {
    const { nb, en } = resolveRootCategoryNames(r.slug, nbNames, enNames, r.name);
    const preview = mergedFeaturedPreview(r.slug, r, nbRoots, enRoots);
    return {
      slug: r.slug,
      name: locale === "en" ? en : nb,
      nameNb: nb,
      nameEn: en,
      count: rollupVariantTotalsFromCounts(r, directVariantCounts),
      href: `/produkter?cat=${encodeURIComponent(r.slug)}`,
      remoteImageSrc: absoluteAssetUrl(preview),
    };
  });
}

function pickLocalizedText(primary: string, alternate: string, locale: Locale): string {
  const p = primary.trim();
  const a = alternate.trim();
  if (locale === "en") return p || a;
  return p || a;
}

export function buildLocalizedCategoryNameMap(
  displayRoots: VCollectionNav[],
  locale: Locale,
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
): Map<string, string> {
  return categoryNameMapForLocale(displayRoots, locale, nbRoots, enRoots);
}

export function buildLocalizedCategoryNameMapsBoth(
  displayRoots: VCollectionNav[],
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
): { nb: Map<string, string>; en: Map<string, string> } {
  return categoryNameMapsBoth(displayRoots, nbRoots, enRoots);
}

export { pickLocalizedText };

function buildFlattenedTranslations(roots: VCollectionNav[]): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (node: VCollectionNav) => {
    map.set(node.slug, node.name);
    for (const child of node.children ?? []) walk(child);
  };
  for (const r of roots) walk(r);
  return map;
}

function localizedCategoryTilesAnyDepth(
  nodes: VCollectionNav[],
  locale: Locale,
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
  directVariantCounts: DirectVariantCounts,
): HomepageCategoryTile[] {
  const displayNodes = dedupeNavRootsBySlug(nodes);
  const nbNames = buildFlattenedTranslations(nbRoots);
  const enNames = buildFlattenedTranslations(enRoots);
  
  return displayNodes.map((r) => {
    const storeNb = nbNames.get(r.slug) || r.name;
    const storeEn = enNames.get(r.slug) || storeNb;
    const { nb, en } = resolveCollectionDisplayNames(r.slug, storeNb, storeEn, r.name);
    const name = locale === "en" ? en : nb;
    
    return {
      slug: r.slug,
      name,
      nameNb: nb,
      nameEn: en,
      count: rollupVariantTotalsFromCounts(r, directVariantCounts),
      href: `/produkter?cat=${encodeURIComponent(r.slug)}`,
      remoteImageSrc: absoluteAssetUrl(r.featuredAsset?.preview || r.featuredAsset?.source),
    };
  });
}

function findNavNodeBySlug(roots: VCollectionNav[], targetSlug: string): VCollectionNav | null {
  for (const node of roots) {
    if (node.slug === targetSlug) return node;
    if (node.children?.length) {
      const found = findNavNodeBySlug(node.children, targetSlug);
      if (found) return found;
    }
  }
  return null;
}

/** Ancestor chain from a nav root down to `targetSlug` (inclusive). */
function findNavPathBySlug(roots: VCollectionNav[], targetSlug: string): VCollectionNav[] | null {
  for (const node of roots) {
    if (node.slug === targetSlug) return [node];
    if (node.children?.length) {
      const childPath = findNavPathBySlug(node.children, targetSlug);
      if (childPath) return [node, ...childPath];
    }
  }
  return null;
}

function extractAllDescendantIds(node: VCollectionNav): string[] {
  const ids: string[] = [node.id];
  for (const child of node.children ?? []) {
    ids.push(...extractAllDescendantIds(child));
  }
  return ids;
}

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
      const [nav, navNb, navEn, dualSearch] = await Promise.all([
        fetchNavRoots(lc),
        fetchNavRoots("nb"),
        fetchNavRoots("en"),
        getGlobalProductSearchHitsDual(),
      ]);
      const { roots, error, categoriesSectionCopy, categoriesListingPage, directVariantCounts } = nav;
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
      const displayRoots = dedupeNavRootsBySlug(roots);
      const { nb: slugToCategoryNameNb, en: slugToCategoryNameEn } = categoryNameMapsBoth(
        displayRoots,
        navNb.roots,
        navEn.roots,
      );
      const slugToCategoryName = locale === "en" ? slugToCategoryNameEn : slugToCategoryNameNb;

      const categories = localizedCategoryTiles(roots, locale, navNb.roots, navEn.roots, directVariantCounts);

      const labelAllNb = "Alle";
      const labelAllEn = "All";

      const baseHits = locale === "en" ? dualSearch.en : dualSearch.nb;
      const nbBySlug = searchHitsBySlug(dualSearch.nb);
      const enBySlug = searchHitsBySlug(dualSearch.en);

      const products = baseHits.map((h) =>
        hitToCard(locale, h, idToRoot, slugToCategoryNameNb, slugToCategoryNameEn, nbBySlug, enBySlug),
      );

      const filtersNb = [labelAllNb, ...displayRoots.map((r) => slugToCategoryNameNb.get(r.slug) ?? r.name)];
      const filtersEn = [labelAllEn, ...displayRoots.map((r) => slugToCategoryNameEn.get(r.slug) ?? r.name)];
      const filterSlugs = [null as string | null, ...displayRoots.map((r) => r.slug)];

      return {
        categories,
        categoriesSectionCopy,
        categoriesListingPage,
        productsBlock: {
          filters: locale === "en" ? filtersEn : filtersNb,
          filtersNb,
          filtersEn,
          filterSlugs,
          products,
          error: dualSearch.error,
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
  async (
    locale: Locale,
    requestedCatSlug: string | null,
    requestedSearchTerm?: string | null,
  ): Promise<ProductsListingCatalogPayload> => {
    const lc = locale === "en" ? "en" : "nb";
    const searchQuery = requestedSearchTerm?.trim() || null;
    const emptySection = (err?: string | null): ProductsSectionPayload => ({
      filters: locale === "en" ? ["All"] : ["Alle"],
      filterSlugs: [null],
      products: [],
      error: err ?? null,
    });

    try {
      const termSearchPromise = searchQuery
        ? Promise.all([
            accumulateSearch("nb", { term: searchQuery }),
            accumulateSearch("en", { term: searchQuery }),
          ]).then(([nbRes, enRes]) => ({
            nb: nbRes.hits,
            en: enRes.hits,
            error: nbRes.error ?? enRes.error ?? null,
          }))
        : null;

      const [nav, navNb, navEn, dualSearch, globalDualSearch] = await Promise.all([
        fetchNavRoots(lc),
        fetchNavRoots("nb"),
        fetchNavRoots("en"),
        termSearchPromise ?? getGlobalProductSearchHitsDual(),
        searchQuery ? getGlobalProductSearchHitsDual() : Promise.resolve(null),
      ]);
      if (!nav.roots.length) {
        const { error: megaErr } = await getMegaMenuBothLocales();
        return {
          listing: nav.productsListingPage,
          validatedCatSlug: null,
          categoryBreadcrumbs: [],
          catalog: emptySection(megaErr ?? nav.error ?? "[catalog] No collections returned."),
        };
      }

      const cat = searchQuery ? null : requestedCatSlug?.trim() || null;
      const activeNode = cat ? findNavNodeBySlug(nav.roots, cat) : null;
      const validatedCatSlug = activeNode ? activeNode.slug : null;

      const idToRoot = buildCollectionIdToRootSlug(nav.roots);
      const displayRoots = dedupeNavRootsBySlug(nav.roots);
      const { nb: slugToCategoryNameNb, en: slugToCategoryNameEn } = categoryNameMapsBoth(
        displayRoots,
        navNb.roots,
        navEn.roots,
      );

      const categoryBreadcrumbs: CategoryBreadcrumb[] = (() => {
        if (!activeNode) return [];
        const path = findNavPathBySlug(nav.roots, activeNode.slug);
        if (!path?.length) return [];
        const nameMap = locale === "en" ? slugToCategoryNameEn : slugToCategoryNameNb;
        return path.map((node) => ({
          slug: node.slug,
          label: nameMap.get(node.slug) ?? node.name,
        }));
      })();

      const baseHits = locale === "en" ? dualSearch.en : dualSearch.nb;
      const nbBySlug = searchHitsBySlug(dualSearch.nb);
      const enBySlug = searchHitsBySlug(dualSearch.en);
      const localizedHits = baseHits.map((h) => applyLocaleToSearchHit(h, locale, nbBySlug, enBySlug));

      const sidebarHitsSource = globalDualSearch ?? dualSearch;
      const sidebarBaseHits = locale === "en" ? sidebarHitsSource.en : sidebarHitsSource.nb;
      
      const nbNamesFlattened = buildFlattenedTranslations(navNb.roots);
      const enNamesFlattened = buildFlattenedTranslations(navEn.roots);
      const sidebarTree = buildSidebarTree(displayRoots, locale, nbNamesFlattened, enNamesFlattened, nav.directVariantCounts);

      const allowedCollectionIds = activeNode ? new Set(extractAllDescendantIds(activeNode)) : null;

      const visibleHits =
        allowedCollectionIds === null
          ? localizedHits
          : localizedHits.filter((h) => 
              (h.collectionIds ?? []).some(id => allowedCollectionIds.has(id))
            );

      const products = visibleHits.map((h) =>
        hitToCard(locale, h, idToRoot, slugToCategoryNameNb, slugToCategoryNameEn, nbBySlug, enBySlug),
      );
      
      const labelAllNb = "Alle";
      const labelAllEn = "All";
      const filtersNb = [labelAllNb, ...displayRoots.map((r) => slugToCategoryNameNb.get(r.slug) ?? r.name)];
      const filtersEn = [labelAllEn, ...displayRoots.map((r) => slugToCategoryNameEn.get(r.slug) ?? r.name)];

      // Compute subcategories
      let subcategories: HomepageCategoryTile[] = [];
      if (activeNode && activeNode.children && activeNode.children.length > 0) {
        subcategories = localizedCategoryTilesAnyDepth(activeNode.children, locale, navNb.roots, navEn.roots, nav.directVariantCounts);
      } else if (!activeNode) {
        subcategories = localizedCategoryTilesAnyDepth(nav.roots, locale, navNb.roots, navEn.roots, nav.directVariantCounts);
      }

      const sidebarRootSlug = activeNode ? (idToRoot.get(activeNode.id) ?? null) : null;

      return {
        listing: nav.productsListingPage,
        validatedCatSlug,
        categoryBreadcrumbs,
        catalog: {
          filters: locale === "en" ? filtersEn : filtersNb,
          filtersNb,
          filtersEn,
          filterSlugs: [null as string | null, ...displayRoots.map((r) => r.slug)],
          products,
          subcategories,
          sidebarRootSlug,
          sidebarTree,
          searchQuery,
          error: dualSearch.error ?? nav.error ?? null,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        listing: { ...EMPTY_LISTING_PAGE },
        validatedCatSlug: null,
        categoryBreadcrumbs: [],
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
  CategoryBreadcrumb,
  MegaMenuLocales,
} from "./catalog-types";
