import { catalogCache } from "@/lib/vendure/catalog-cache";
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
  buildNorwegianCategoryNameMap,
  sortNavCollections,
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
import { storefrontNorwegianCategoryName } from "@/data/collectionLabels";
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

async function accumulateDirectVariantCounts(locale: string, firstBranch: unknown): Promise<DirectVariantCounts> {
  const merged = new Map<string, number>();
  const first = validateFlattenedCollectionCounts(firstBranch);
  first.map.forEach((v, k) => merged.set(k, v));

  let skip = merged.size;
  const total = first.totalItems;

  while (skip < total) {
    const { data, error } = await vendureShopQuery<{ storefrontCollectionCounts?: unknown }>(
      GQL_COLLECTION_COUNTS_PAGE,
      { take: COLLECTION_COUNT_PAGE, skip },
      locale,
    );
    if (error) break;
    const page = validateFlattenedCollectionCounts(data?.storefrontCollectionCounts);
    page.map.forEach((v, k) => merged.set(k, v));
    if (page.map.size < COLLECTION_COUNT_PAGE) break;
    skip += COLLECTION_COUNT_PAGE;
  }

  return merged;
}

function rootsToCategoryTiles(
  roots: VCollectionNav[],
  directVariantCounts: DirectVariantCounts,
): HomepageCategoryTile[] {
  return dedupeNavRootsBySlug(sortNavCollections(roots)).map((r) => {
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
  for (const r of sortNavCollections(roots)) attach(r, r.slug);
  return m;
}

function rootSlugFromCollectionIds(
  hit: SearchHitRaw,
  idToRoot: Map<string, string>,
  displayRootSlugs?: Set<string>,
): string | null {
  const preferDisplay = displayRootSlugs && displayRootSlugs.size > 0;
  if (preferDisplay) {
    for (const id of hit.collectionIds ?? []) {
      const slug = idToRoot.get(id);
      if (slug && displayRootSlugs!.has(slug)) return slug;
    }
  }
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
  const nb = storefrontNorwegianCategoryName(slug, nbNames, fallbackName);
  const en =
    storeEn ||
    storeNb ||
    rootCategoryLabelsForSlug(slug)?.nameEn ||
    fallbackName;
  return { nb, en };
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
  displayRootSlugs?: Set<string>,
): CatalogProductCard {
  const localizedHit = applyLocaleToSearchHit(hit, locale, nbBySlug, enBySlug);
  const nbHit = nbBySlug.get(hit.slug);
  const enHit = enBySlug.get(hit.slug);
  const rootSlug =
    rootSlugFromCollectionIds(hit, idToRoot, displayRootSlugs) ??
    [...(displayRootSlugs ?? slugToCategoryNameNb.keys())][0] ??
    "";
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
  displayRootSlugs?: Set<string>,
): CatalogProductCard {
  return hitToCard(
    locale,
    hit,
    idToRoot,
    slugToCategoryNameNb,
    slugToCategoryNameEn,
    nbBySlug,
    enBySlug,
    displayRootSlugs,
  );
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
  const roots = validated == null ? [] : sortNavCollections(validated);

  return {
    roots,
    categoriesSectionCopy,
    categoriesListingPage,
    productsListingPage,
    directVariantCounts,
    error: error ?? null,
  };
}

export const fetchNavRoots = catalogCache(async (locale: string): Promise<NavRootsPayload> => {
  const { data, error } = await vendureShopQuery<{
    collections?: unknown;
    activeChannel?: unknown;
    storefrontCollectionCounts?: unknown;
  }>(GQL_NAV_COLLECTIONS, undefined, locale);

  return assembleNavRootsFromShopData(locale, data, error, true);
}, ["fetchNavRoots"]);

/** Cached nav for `/kategorier` only: same tree + counts; smaller Channel fragment; no products-listing channel copy. */
const fetchNavRootsKategorierPage = catalogCache(async (locale: string): Promise<NavRootsPayload> => {
  const { data, error } = await vendureShopQuery<{
    collections?: unknown;
    activeChannel?: unknown;
    storefrontCollectionCounts?: unknown;
  }>(GQL_NAV_COLLECTIONS_KATEGORIER, undefined, locale);

  return assembleNavRootsFromShopData(locale, data, error, false);
}, ["fetchNavRootsKategorierPage"]);

export type CategoriesPagePayload = {
  categories: HomepageCategoryTile[];
  categoriesSectionCopy: CategoriesSectionCopy;
  categoriesListingPage: CategoriesListingPageCopy;
  error?: string | null;
};

/** `/kategorier` — category grid + listing copy only (no global product search). */
export const getCategoriesPagePayload = catalogCache(async (locale: Locale): Promise<CategoriesPagePayload> => {
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
}, ["getCategoriesPagePayload"]);

/** Channel copy for /produkter hero + `<title>` (shares cached `fetchNavRoots` with the listing loader). */
export const getProductsListingPageCopy = catalogCache(async (locale: Locale): Promise<ProductsListingPageCopy> => {
  const lc = locale === "en" ? "en" : "nb";
  try {
    const { productsListingPage } = await fetchNavRoots(lc);
    return productsListingPage;
  } catch {
    return { ...EMPTY_LISTING_PAGE };
  }
}, ["getProductsListingPageCopy"]);

async function searchGrouped(locale: string, input: Record<string, unknown>) {
  return vendureShopQuery<unknown>(
    GQL_SEARCH_PRODUCTS,
    { input: { ...input, groupByProduct: true } },
    locale,
  );
}

export const getMegaMenuBothLocales = catalogCache(async (): Promise<{ data: MegaMenuLocales; error?: string | null }> => {
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
}, ["getMegaMenuBothLocales"]);

export type FooterRootCategory = { slug: string; labelNb: string; labelEn: string };

/** Root category links for footer — same order as mega menu / admin `position`. */
export function megaMenuToFooterRoots(mega: MegaMenuLocales): FooterRootCategory[] {
  const nbRoots = mega.nb ?? [];
  const enBySlug = new Map((mega.en ?? []).map((r) => [r.id, r.label]));
  return nbRoots.map((r) => ({
    slug: r.id,
    labelNb: r.label,
    labelEn: enBySlug.get(r.id) ?? r.label,
  }));
}

function buildSidebarTree(
  nodes: VCollectionNav[],
  locale: Locale,
  nbNames: Map<string, string>,
  enNames: Map<string, string>,
  directVariantCounts: DirectVariantCounts,
): SidebarTreeNode[] {
  return sortNavCollections(nodes).map((node) => {
    const nb = storefrontNorwegianCategoryName(node.slug, nbNames, node.name);
    const storeEn = enNames.get(node.slug)?.trim() || "";
    const en = storeEn || nb;
    const name = locale === "en" ? en : nb;

    return {
      id: node.id,
      slug: node.slug,
      name,
      nameNb: nb,
      nameEn: en,
      count: rollupVariantTotalsFromCounts(node, directVariantCounts),
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
export const getGlobalProductSearchHits = catalogCache(
  (locale: string) => accumulateSearch(locale, {}),
  ["getGlobalProductSearchHits"],
);

/** Both locales for product search — merge display fields without changing catalogue structure. */
export const getGlobalProductSearchHitsDual = catalogCache(async () => {
  const [nb, en] = await Promise.all([getGlobalProductSearchHits("nb"), getGlobalProductSearchHits("en")]);
  return {
    nb: nb.hits,
    en: en.hits,
    error: nb.error ?? en.error ?? null,
  };
}, ["getGlobalProductSearchHitsDual"]);

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
  const nbNames = buildNorwegianCategoryNameMap(nbRoots);
  const enNames = buildNorwegianCategoryNameMap(enRoots);
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
  const nbNames = buildNorwegianCategoryNameMap(nbRoots);
  const enNames = buildNorwegianCategoryNameMap(enRoots);
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
  const displayRoots = dedupeNavRootsBySlug(nbRoots);
  const nbNames = buildNorwegianCategoryNameMap(nbRoots);
  const enNames = buildNorwegianCategoryNameMap(enRoots);
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
  return buildNorwegianCategoryNameMap(roots);
}

/** PDP sidebar only — nav tree without loading the full product search index. */
export const getProductPageSidebarTree = catalogCache(async (locale: Locale): Promise<SidebarTreeNode[]> => {
  const [navNb, navEn] = await Promise.all([fetchNavRoots("nb"), fetchNavRoots("en")]);
  if (!navNb.roots.length) return [];

  // Same structure/order as mega menu — always derive from NB roots, then localize labels.
  const displayRoots = dedupeNavRootsBySlug(navNb.roots);
  const nbNames = buildFlattenedTranslations(navNb.roots);
  const enNames = buildFlattenedTranslations(navEn.roots);
  return buildSidebarTree(displayRoots, locale, nbNames, enNames, navNb.directVariantCounts);
}, ["getProductPageSidebarTree"]);

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
    const nb = storefrontNorwegianCategoryName(r.slug, nbNames, r.name);
    const en = enNames.get(r.slug)?.trim() || nb;
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
  for (const node of sortNavCollections(roots)) {
    if (node.slug === targetSlug) return node;
    if (node.children?.length) {
      const found = findNavNodeBySlug(node.children, targetSlug);
      if (found) return found;
    }
  }
  return null;
}

function findAllNavNodesBySlug(roots: VCollectionNav[], targetSlug: string): VCollectionNav[] {
  const found: VCollectionNav[] = [];
  const walk = (nodes: VCollectionNav[]) => {
    for (const node of sortNavCollections(nodes)) {
      if (node.slug === targetSlug) found.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(roots);
  return found;
}

/** Ancestor chain from a nav root down to `targetSlug` (inclusive). */
function findNavPathBySlug(roots: VCollectionNav[], targetSlug: string): VCollectionNav[] | null {
  for (const node of sortNavCollections(roots)) {
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
  for (const child of sortNavCollections(node.children ?? [])) {
    ids.push(...extractAllDescendantIds(child));
  }
  return ids;
}

export const getHomepageCatalogPayload = catalogCache(
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
      const displayRoots = dedupeNavRootsBySlug(navNb.roots);
      const displayRootSlugs = new Set(displayRoots.map(r => r.slug));
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

      const products = baseHits.map(h =>
        hitToCard(
          locale,
          h,
          idToRoot,
          slugToCategoryNameNb,
          slugToCategoryNameEn,
          nbBySlug,
          enBySlug,
          displayRootSlugs,
        ),
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
  ["getHomepageCatalogPayload"],
);

export const getProductsListingCatalog = catalogCache(
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
      const displayRoots = dedupeNavRootsBySlug(navNb.roots);
      const displayRootSlugs = new Set(displayRoots.map(r => r.slug));
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

      const allowedCollectionIds = cat
        ? new Set(
            findAllNavNodesBySlug(nav.roots, cat).flatMap(node => extractAllDescendantIds(node)),
          )
        : null;

      const visibleHits =
        allowedCollectionIds === null || allowedCollectionIds.size === 0
          ? localizedHits
          : localizedHits.filter(h =>
              (h.collectionIds ?? []).some(id => allowedCollectionIds.has(id)),
            );

      const products = visibleHits.map(h =>
        hitToCard(
          locale,
          h,
          idToRoot,
          slugToCategoryNameNb,
          slugToCategoryNameEn,
          nbBySlug,
          enBySlug,
          displayRootSlugs,
        ),
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
  ["getProductsListingCatalog"],
);

export const getProductsPagePayload = catalogCache(async (locale: Locale): Promise<ProductsSectionPayload> => {
  const { productsBlock } = await getHomepageCatalogPayload(locale);
  return productsBlock;
}, ["getProductsPagePayload"]);

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
