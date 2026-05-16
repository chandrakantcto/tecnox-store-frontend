
import { resolveVendureShopConfig } from "@/config/vendure";

export type VCollectionNav = {
  id: string;
  slug: string;
  name: string;
  position: number;
  parentId?: string | null;
  productVariantCount?: number | null;
  featuredAsset?: { preview: string; source: string; id?: string } | null;
  children?: VCollectionNav[];
};

/** Merge admin asset host with relative previews from Vendure */
export function absoluteAssetUrl(previewOrSource: string | null | undefined): string | null {
  if (!previewOrSource?.trim()) return null;
  const p = previewOrSource.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const cfg = resolveVendureShopConfig();
  if (!cfg) return null;
  const { assetBaseUrl } = cfg;
  if (p.startsWith("/")) return `${assetBaseUrl}${p}`;
  return `${assetBaseUrl}/${p}`;
}

function sortCollections(items: VCollectionNav[]): VCollectionNav[] {
  return [...items]
    .map((row) => ({
      ...row,
      children: row.children?.length ? sortCollections(row.children) : row.children ?? [],
    }))
    .sort((a, b) => Number(a.position) - Number(b.position));
}

/**
 * Flat pagination result from `collections` (no nested children): id → **direct**
 * variant count for that row only (Vendure’s cache warms counts for IDs in same request).
 */
export function validateFlattenedCollectionCounts(
  branch: unknown,
): { map: Map<string, number>; totalItems: number } {
  const out = new Map<string, number>();
  if (!branch || typeof branch !== "object") return { map: out, totalItems: 0 };
  const b = branch as { items?: unknown; totalItems?: unknown };
  const items = Array.isArray(b.items) ? b.items : [];
  const total =
    typeof b.totalItems === "number"
      ? b.totalItems
      : Number.parseInt(String(b.totalItems ?? "0"), 10) || 0;
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const x = row as Record<string, unknown>;
    const idStr = typeof x.id === "string" || typeof x.id === "number" ? String(x.id) : "";
    if (!idStr) continue;
    let n =
      typeof x.productVariantCount === "number"
        ? x.productVariantCount
        : Number(x.productVariantCount) || 0;
    if (!Number.isFinite(n) || n < 0) n = 0;
    out.set(idStr, n);
  }
  return { map: out, totalItems: total };
}

/** Validate loosely so bad API payloads never crash the tree walk */
export function validateNavCollectionsPayload(raw: unknown): VCollectionNav[] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { collections?: { items?: unknown } };
  const items = o.collections?.items;
  if (!Array.isArray(items)) return [];
  const walk = (c: unknown): VCollectionNav | null => {
    if (!c || typeof c !== "object") return null;
    const x = c as Record<string, unknown>;
    if (typeof x.slug !== "string" || typeof x.name !== "string") return null;
    const idStr = typeof x.id === "string" || typeof x.id === "number" ? String(x.id) : null;
    if (!idStr) return null;
    const childrenRaw = Array.isArray(x.children) ? x.children : [];
    const kids = childrenRaw.map(walk).filter((n): n is VCollectionNav => n != null);
    return {
      id: idStr,
      slug: x.slug,
      name: x.name,
      position: typeof x.position === "number" ? x.position : Number(x.position) || 0,
      parentId:
        typeof x.parentId === "string" || typeof x.parentId === "number"
          ? String(x.parentId)
          : undefined,
      productVariantCount:
        typeof x.productVariantCount === "number"
          ? x.productVariantCount
          : Number(x.productVariantCount) || 0,
      featuredAsset:
        x.featuredAsset && typeof x.featuredAsset === "object"
          ? (() => {
              const fa = x.featuredAsset as Record<string, unknown>;
              const preview = typeof fa.preview === "string" ? fa.preview : "";
              const source = typeof fa.source === "string" ? fa.source : "";
              return { preview, source };
            })()
          : null,
      children: kids.length ? kids : [],
    };
  };
  const roots = items.map(walk).filter((n): n is VCollectionNav => n != null);
  return sortCollections(roots);
}

export type SearchHitRaw = {
  sku: string;
  slug: string;
  productId: string;
  productName: string;
  description: string | null | undefined;
  productAsset?: { preview: string; id?: string } | null;
  priceWithTax?: unknown;
  collectionIds?: string[];
};

export function validateSearchPayload(raw: unknown): { hits: SearchHitRaw[]; totalItems: number } {
  if (!raw || typeof raw !== "object") return { hits: [], totalItems: 0 };
  const s = (raw as { search?: { items?: unknown; totalItems?: unknown } }).search;
  const items = Array.isArray(s?.items) ? s.items : [];
  const total =
    typeof s?.totalItems === "number"
      ? s.totalItems
      : Number.parseInt(String(s?.totalItems ?? "0"), 10) || 0;
  const hits: SearchHitRaw[] = [];
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const slug = typeof r.slug === "string" ? r.slug : null;
    const productName = typeof r.productName === "string" ? r.productName : null;
    if (!slug || !productName) continue;
    hits.push({
      sku: typeof r.sku === "string" ? r.sku : "",
      slug,
      productId:
        typeof r.productId === "string"
          ? r.productId
          : r.productId != null
            ? String(r.productId)
            : "",
      productName,
      description: typeof r.description === "string" ? r.description : "",
      productAsset:
        r.productAsset && typeof r.productAsset === "object"
          ? {
              preview: String((r.productAsset as Record<string, unknown>).preview ?? ""),
              id:
                typeof (r.productAsset as Record<string, unknown>).id === "string"
                  ? ((r.productAsset as Record<string, unknown>).id as string)
                  : undefined,
            }
          : null,
      priceWithTax: r.priceWithTax,
      collectionIds: Array.isArray(r.collectionIds) ? r.collectionIds.map((id) => String(id)) : [],
    });
  }
  return { hits, totalItems: total };
}

export function minorUnitsFromMoney(m: unknown): number | null {
  if (typeof m === "number" && Number.isFinite(m)) return m;
  if (typeof m === "string" && m.trim()) {
    const n = Number(m);
    if (Number.isFinite(n)) return n;
  }
  if (m && typeof m === "object") {
    const v = (m as Record<string, unknown>).value;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/** Best-effort brand label when only the variant SKU / search row is known. */
export function inferBrandFromSku(sku: string | undefined | null): string {
  const s = sku?.trim();
  if (!s || s.length <= 14) return "TECNOX";
  return s.includes("-") ? s.split("-")[0]!.toUpperCase() : s.slice(0, 14).toUpperCase();
}

/** Returns minor units from SearchResult.priceWithTax */
export function priceMinorFromHit(priceWithTax: unknown): number | null {
  if (!priceWithTax || typeof priceWithTax !== "object") return null;
  const p = priceWithTax as Record<string, unknown>;
  if (p.__typename === "SinglePrice") {
    return minorUnitsFromMoney(p.value);
  }
  if (p.__typename === "PriceRange") {
    const min = minorUnitsFromMoney(p.min);
    if (typeof min === "number") return min;
    return minorUnitsFromMoney(p.max);
  }
  if ("value" in p && p.value !== undefined) {
    return minorUnitsFromMoney((p as { value: unknown }).value);
  }
  return null;
}

export function formatNOKExclVatFromMinor(locale: string, minor: number | null): string {
  if (minor === null || !Number.isFinite(minor)) return "—";
  const nok = minor / 100;
  const nf = Intl.NumberFormat(locale === "en" ? "en-GB" : "nb-NO", {
    maximumFractionDigits: 0,
  });
  if (locale === "en") return `From NOK ${nf.format(nok)} excl. VAT`;
  return `Fra kr ${nf.format(nok).replace(/\u00a0/g, " ")} eks. MVA`;
}
