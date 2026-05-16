import { cache } from "react";
import {
  selectCheapestVariant,
  type LocalizedBulletBundle,
  type Product,
  type ProductReview,
  type StorefrontVariantDetail,
} from "@/lib/catalog/storefront-product";
import type { Locale } from "@/lib/locale";
import { staticSrc } from "@/lib/static-asset";
import type { CatalogProductCard } from "@/lib/vendure/catalog-types";
import {
  fetchNavRoots,
  searchHitToCatalogCard,
} from "@/lib/vendure/catalog-data";
import {
  absoluteAssetUrl,
  formatNOKExclVatFromMinor,
  inferBrandFromSku,
  minorUnitsFromMoney,
  validateSearchPayload,
  type SearchHitRaw,
  type VCollectionNav,
} from "@/lib/vendure/normalize";
import { GQL_SEARCH_PRODUCTS, GQL_STOREFRONT_PRODUCT, GQL_STOREFRONT_PRODUCT_PDP_EXTRA } from "@/lib/vendure/queries";
import { vendureShopQuery } from "@/lib/vendure/shop-fetch";

function stripHtmlMarkup(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function bulletsFromRichDescription(html: string, max = 6): string[] {
  const lis = [...html.matchAll(/<li[^>]*>\s*([^<]+)/gi)]
    .map((m) => stripHtmlMarkup(String(m[1] ?? "").trim()))
    .filter(Boolean);
  if (lis.length) return lis.slice(0, max);

  const plain = stripHtmlMarkup(html);
  if (!plain) return [];

  const parts = plain
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  if (parts.length) return parts.slice(0, max);

  return plain.length > 140 ? [`${plain.slice(0, 137)}…`] : plain ? [plain] : [];
}

function exVatMinorFromInclusiveMinor(minorInclusive: number | null): number | null {
  if (minorInclusive === null) return null;
  return Math.round(minorInclusive / 1.25);
}

function oneLineSpecFromDescription(htmlOrText: string): string {
  const plain = stripHtmlMarkup(htmlOrText);
  if (!plain) return "";
  return plain.length > 100 ? `${plain.slice(0, 97)}…` : plain;
}

type RawFacetVal = {
  code?: unknown;
  name?: unknown;
  facet?: { code?: unknown; name?: unknown };
};

function brandFromFacets(values: RawFacetVal[], sku: string): string {
  const v = values.find((x) => {
    const fc = typeof x?.facet?.code === "string" ? x.facet.code.toLowerCase() : "";
    return fc === "brand" || fc === "merke";
  });
  const name = typeof v?.name === "string" ? v.name.trim() : "";
  if (name) return name;
  return inferBrandFromSku(sku);
}

function specsRowsFromFacetValues(values: RawFacetVal[], sku: string): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [{ label: "SKU", value: sku }];
  const skipFacet = new Set(["brand", "merke"]);

  for (const fv of values) {
    const facetCodeRaw = fv?.facet?.code;
    const facetCode = typeof facetCodeRaw === "string" ? facetCodeRaw.toLowerCase() : "";
    if (skipFacet.has(facetCode)) continue;

    const flabel =
      (typeof fv.facet?.name === "string" && fv.facet.name.trim()) ||
      (typeof facetCodeRaw === "string" && facetCodeRaw.trim()) ||
      "—";

    const vName = typeof fv.name === "string" ? fv.name.trim() : "";
    if (!vName) continue;
    out.push({ label: flabel, value: vName });
  }

  return out.slice(0, 24);
}

function mergeFacetValuesForSpecs(productFv: RawFacetVal[], variantFv: RawFacetVal[]): RawFacetVal[] {
  const map = new Map<string, RawFacetVal>();
  for (const fv of productFv) {
    const fc = fv?.facet?.code;
    if (typeof fc === "string" && fc.trim()) map.set(fc.toLowerCase(), fv);
  }
  for (const fv of variantFv) {
    const fc = fv?.facet?.code;
    if (typeof fc === "string" && fc.trim()) map.set(fc.toLowerCase(), fv);
  }
  return [...map.values()];
}

function parseReviewsJson(raw: string | undefined): ProductReview[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: ProductReview[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const author = typeof o.author === "string" ? o.author.trim() : "";
      const body = typeof o.body === "string" ? o.body.trim() : "";
      const rating = typeof o.rating === "number" && Number.isFinite(o.rating) ? Math.round(o.rating) : 5;
      if (!author || !body) continue;
      const title = typeof o.title === "string" ? o.title.trim() : "";
      const dateIso = typeof o.dateIso === "string" ? o.dateIso.trim() : "";
      out.push({
        author,
        rating: Math.min(5, Math.max(1, rating)),
        ...(title ? { title } : {}),
        body,
        ...(dateIso ? { dateIso } : {}),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function parseBulletsLocalized(raw: string | undefined): LocalizedBulletBundle | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    const nb = Array.isArray(o.nb) ? o.nb.filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean) : [];
    const en = Array.isArray(o.en) ? o.en.filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean) : [];
    if (!nb.length && !en.length) return null;
    return { nb, en };
  } catch {
    return null;
  }
}

function readProductCustomFields(p: Record<string, unknown>): Record<string, unknown> {
  const cf = p.customFields;
  if (cf && typeof cf === "object" && !Array.isArray(cf)) return cf as Record<string, unknown>;
  return {};
}

function collectGalleryUrls(
  featuredPreview: string,
  assets: Record<string, unknown>[],
  variantPreviews: string[],
): string[] {
  const set = new Set<string>();
  const push = (rel: string) => {
    if (!rel.trim()) return;
    if (rel.trim().startsWith("data:image")) {
      set.add(rel.trim());
      return;
    }
    const abs = absoluteAssetUrl(rel.trim());
    if (abs?.trim()) set.add(abs.trim());
  };
  push(featuredPreview);
  for (const a of assets) {
    const p = typeof a.preview === "string" ? a.preview : typeof a.source === "string" ? a.source : "";
    push(p);
  }
  for (const vp of variantPreviews) push(vp);

  const list = [...set];
  if (list.length) return list;
  return [
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="#e8e4df" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b6760" font-family="sans-serif" font-size="18">TECNOX</text></svg>`,
    )}`,
  ];
}

function rootSlugForProductCollections(ids: string[], idToRoot: Map<string, string>): string | null {
  for (const id of ids) {
    const root = idToRoot.get(id);
    if (root) return root;
  }
  return null;
}

function catalogCardToProductStub(card: CatalogProductCard): Product {
  const badgeOk =
    card.badge === "BESTSELGER" || card.badge === "NYHET" ? card.badge : undefined;
  return {
    slug: card.slug,
    name: card.name,
    brand: card.brand,
    spec: card.spec,
    price: card.price,
    priceNumeric: card.priceNumeric,
    category: card.category,
    img: typeof card.img === "string" ? card.img : staticSrc(card.img),
    description: card.description ?? "",
    highlights: [],
    specs: [],
    ...(badgeOk ? { badge: badgeOk } : {}),
  };
}

const RELATED_SEARCH_TAKE = 100;
const RELATED_MAX_ITEMS = 8;
const MAX_COLLECTION_IDS_IN_SEARCH = 40;

async function fetchRelatedProductsForPdp(
  lc: string,
  locale: Locale,
  collIdsOrdered: string[],
  rootSlug: string | null,
  collSlugsOrdered: string[],
  excludeSlug: string,
  idToRoot: Map<string, string>,
  slugToCategoryName: Map<string, string>,
): Promise<Product[]> {
  const toCard = (h: SearchHitRaw) =>
    catalogCardToProductStub(searchHitToCatalogCard(locale, h, idToRoot, slugToCategoryName));

  const seen = new Set<string>();
  const out: Product[] = [];

  const ingestHits = (hits: SearchHitRaw[]): boolean => {
    for (const h of hits) {
      if (h.slug === excludeSlug) continue;
      if (seen.has(h.slug)) continue;
      seen.add(h.slug);
      out.push(toCard(h));
      if (out.length >= RELATED_MAX_ITEMS) return true;
    }
    return false;
  };

  const uniqIds = [...new Set(collIdsOrdered)].slice(0, MAX_COLLECTION_IDS_IN_SEARCH);

  /** Index + Shop search match best on variant collection memberships (incl. leaf IDs). */
  if (uniqIds.length > 0) {
    const { data, error } = await vendureShopQuery<unknown>(
      GQL_SEARCH_PRODUCTS,
      { input: { collectionIds: uniqIds, groupByProduct: true, take: RELATED_SEARCH_TAKE, skip: 0 } },
      lc,
    );
    if (!error && data != null) {
      ingestHits(validateSearchPayload(data).hits);
      if (out.length >= RELATED_MAX_ITEMS) return out;
    }
  }

  /** Fallback: slug-based facets (covers ID drift or empty product.collections IDs). */
  const slugAttempts: string[] = [];
  if (rootSlug) slugAttempts.push(rootSlug);
  for (const s of collSlugsOrdered) {
    if (s.length && !slugAttempts.includes(s)) slugAttempts.push(s);
  }

  for (const collSlug of slugAttempts) {
    const { data, error } = await vendureShopQuery<unknown>(
      GQL_SEARCH_PRODUCTS,
      { input: { collectionSlug: collSlug, groupByProduct: true, take: RELATED_SEARCH_TAKE, skip: 0 } },
      lc,
    );
    if (error || data == null) continue;
    ingestHits(validateSearchPayload(data).hits);
    if (out.length >= RELATED_MAX_ITEMS) return out;
  }

  return out;
}

export type StorefrontProductDetailPayload = {
  product: Product | null;
  relatedProducts: Product[];
  /** Non-null when product missing or upstream failed */
  error: string | null;
};

/** PDP payload — relies only on Shop API (navigation cache is shared via `fetchNavRoots`). */
export const getStorefrontProductDetail = cache(
  async (
    locale: Locale,
    slug: string,
    preferredVariantId?: string | null,
  ): Promise<StorefrontProductDetailPayload> => {
    const lc = locale === "en" ? "en" : "nb";

    try {
      const [{ roots }, productRes, pdpExtrasRes] = await Promise.all([
        fetchNavRoots(lc),
        vendureShopQuery<{ product?: unknown }>(GQL_STOREFRONT_PRODUCT, { slug }, lc),
        vendureShopQuery<{ product?: unknown }>(GQL_STOREFRONT_PRODUCT_PDP_EXTRA, { slug }, lc),
      ]);

      const err = productRes.error;
      const rawRoot = productRes.data?.product;

      const idToRoot = new Map<string, string>();
      const attachNav = (node: VCollectionNav, rootSlug: string) => {
        idToRoot.set(node.id, rootSlug);
        for (const ch of node.children ?? []) attachNav(ch, rootSlug);
      };
      for (const r of roots) attachNav(r, r.slug);

      const slugToCategoryName = new Map(roots.map((r) => [r.slug, r.name] as const));

      if (err || !rawRoot || typeof rawRoot !== "object") {
        return {
          product: null,
          relatedProducts: [],
          error:
            err ?? (rawRoot == null ? `[vendure] No product returned for slug "${slug}"` : `[vendure] Invalid product payload`),
        };
      }

      const p = rawRoot as Record<string, unknown>;

      const productSlug = typeof p.slug === "string" ? p.slug : slug;
      const name = typeof p.name === "string" ? p.name : "";
      const descriptionHtml = typeof p.description === "string" ? p.description : "";

      const collections = Array.isArray(p.collections)
        ? (p.collections.filter((x) => x && typeof x === "object") as Record<string, unknown>[])
        : [];
      const collIds = collections.map((c) =>
        typeof c.id === "string" || typeof c.id === "number" ? String(c.id) : "",
      ).filter(Boolean);
      const collSlugsOrdered = collections.map((c) =>
        typeof c.slug === "string" ? c.slug.trim() : "",
      ).filter(Boolean);

      const rootSlug = rootSlugForProductCollections(collIds, idToRoot);
      const categoryLabel =
        (rootSlug && slugToCategoryName.get(rootSlug)) ?? slugToCategoryName.values().next().value ?? "—";

      const pdpCf =
        !pdpExtrasRes.error &&
        pdpExtrasRes.data?.product &&
        typeof pdpExtrasRes.data.product === "object"
          ? readProductCustomFields(pdpExtrasRes.data.product as Record<string, unknown>)
          : {};

      const reviews = parseReviewsJson(
        typeof pdpCf.storefrontReviewsJson === "string" ? pdpCf.storefrontReviewsJson : undefined,
      );
      const serviceBulletsLocalized =
        parseBulletsLocalized(
          typeof pdpCf.storefrontServiceBulletsJson === "string"
            ? pdpCf.storefrontServiceBulletsJson
            : undefined,
        );
      const quoteBulletsLocalized =
        parseBulletsLocalized(
          typeof pdpCf.storefrontQuoteBulletsJson === "string"
            ? pdpCf.storefrontQuoteBulletsJson
            : undefined,
        );

      const facetValues = Array.isArray(p.facetValues)
        ? (p.facetValues.filter((x) => x && typeof x === "object") as RawFacetVal[])
        : [];

      const variantRowsRaw = Array.isArray(p.variants)
        ? (p.variants.filter((x) => x && typeof x === "object") as Record<string, unknown>[])
        : [];

      if (!variantRowsRaw.length) {
        return {
          product: null,
          relatedProducts: [],
          error: `[vendure] Product "${slug}" has no variants.`,
        };
      }

      const fa =
        p.featuredAsset && typeof p.featuredAsset === "object"
          ? (p.featuredAsset as Record<string, unknown>)
          : null;
      const productFeaturedRel =
        typeof fa?.preview === "string"
          ? fa.preview
          : typeof fa?.source === "string"
            ? fa.source
            : "";
      const assetsList = Array.isArray(p.assets)
        ? (p.assets.filter((x) => x && typeof x === "object") as Record<string, unknown>[])
        : [];

      const storefrontVariants: StorefrontVariantDetail[] = [];
      const variantPreviewRels: string[] = [];

      for (const vr of variantRowsRaw) {
        const id = typeof vr.id === "string" || typeof vr.id === "number" ? String(vr.id) : "";
        const sku = typeof vr.sku === "string" ? vr.sku : "";
        if (!id || !sku) continue;

        const vf = Array.isArray(vr.facetValues)
          ? (vr.facetValues.filter((x) => x && typeof x === "object") as RawFacetVal[])
          : [];
        const merged = mergeFacetValuesForSpecs(facetValues, vf);

        const vFa =
          vr.featuredAsset && typeof vr.featuredAsset === "object"
            ? (vr.featuredAsset as Record<string, unknown>)
            : null;
        const variantRelPreview =
          typeof vFa?.preview === "string"
            ? vFa.preview
            : typeof vFa?.source === "string"
              ? vFa.source
              : "";
        if (variantRelPreview.trim()) variantPreviewRels.push(variantRelPreview);

        const optionsRaw = Array.isArray(vr.options)
          ? vr.options.filter((x) => x && typeof x === "object") as Record<string, unknown>[]
          : [];
        const options = optionsRaw.map((opt) => {
          const gn =
            opt.group && typeof opt.group === "object" ? (opt.group as Record<string, unknown>) : null;
          return {
            id: typeof opt.id === "string" || typeof opt.id === "number" ? String(opt.id) : "",
            code: typeof opt.code === "string" ? opt.code : "",
            name: typeof opt.name === "string" ? opt.name : "",
            groupId:
              typeof opt.groupId === "string"
                ? opt.groupId
                : gn && typeof gn.id === "string"
                  ? gn.id
                  : "",
            groupCode: gn && typeof gn.code === "string" ? gn.code : "",
            groupName: gn && typeof gn.name === "string" ? gn.name : "",
          };
        });

        const inc = minorUnitsFromMoney(vr.priceWithTax);
        const minorEx = exVatMinorFromInclusiveMinor(inc);

        const imgCandidate =
          (variantRelPreview.trim() && (absoluteAssetUrl(variantRelPreview.trim()) ?? null)) ??
          (productFeaturedRel.trim() && (absoluteAssetUrl(productFeaturedRel.trim()) ?? null)) ??
          null;

        storefrontVariants.push({
          id,
          sku,
          name: typeof vr.name === "string" ? vr.name : sku,
          stockLevel:
            typeof vr.stockLevel === "string" ? vr.stockLevel : String(vr.stockLevel ?? "—"),
          options,
          priceLabelExVat: formatNOKExclVatFromMinor(locale, minorEx),
          priceNumericExVat: typeof minorEx === "number" ? minorEx : 0,
          imageSrc: imgCandidate,
          specs: specsRowsFromFacetValues(merged, sku),
        });
      }

      if (!storefrontVariants.length) {
        return {
          product: null,
          relatedProducts: [],
          error: `[vendure] Product "${slug}" variants could not be normalized.`,
        };
      }

      const cheapest = selectCheapestVariant(storefrontVariants);
      const chosen =
        preferredVariantId &&
        storefrontVariants.some((v) => v.id === preferredVariantId)
          ? storefrontVariants.find((v) => v.id === preferredVariantId)!
          : cheapest ?? storefrontVariants[0];

      const bestSku = chosen.sku;

      const brand = brandFromFacets(facetValues, bestSku);
      const specs = chosen.specs;
      const galleryImageUrls = collectGalleryUrls(productFeaturedRel, assetsList, variantPreviewRels);
      const heroImg = chosen.imageSrc ?? galleryImageUrls[0]!;

      const productRecord: Product = {
        slug: productSlug,
        name,
        brand,
        category: typeof categoryLabel === "string" ? categoryLabel : "—",
        spec: oneLineSpecFromDescription(descriptionHtml),
        price: chosen.priceLabelExVat,
        priceNumeric: chosen.priceNumericExVat,
        description: stripHtmlMarkup(descriptionHtml) || descriptionHtml,
        descriptionHtml,
        highlights: bulletsFromRichDescription(descriptionHtml),
        specs,
        img: heroImg,
        variants: storefrontVariants,
        defaultVariantId: cheapest?.id ?? storefrontVariants[0]?.id ?? null,
        hydratedVariantId: chosen.id,
        galleryImageUrls,
        reviews,
        serviceBulletsLocalized: serviceBulletsLocalized ?? undefined,
        quoteBulletsLocalized: quoteBulletsLocalized ?? undefined,
      };

      const relatedProducts = await fetchRelatedProductsForPdp(
        lc,
        locale,
        collIds,
        rootSlug,
        collSlugsOrdered,
        productSlug,
        idToRoot,
        slugToCategoryName,
      );

      return { product: productRecord, relatedProducts, error: productRes.error ?? null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { product: null, relatedProducts: [], error: msg };
    }
  },
);
