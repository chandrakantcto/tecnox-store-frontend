
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
  const cfg = resolveVendureShopConfig();

  if (p.startsWith("http://") || p.startsWith("https://")) {
    if (!cfg) return p;
    try {
      const src = new URL(p);
      const base = new URL(cfg.assetBaseUrl);
      // Vendure often stores stale absolute previews (e.g. localhost) — serve from configured host.
      if (src.origin !== base.origin) {
        return `${cfg.assetBaseUrl}${src.pathname}${src.search}${src.hash}`;
      }
    } catch {
      /* keep original below */
    }
    return p;
  }

  if (!cfg) return null;
  const { assetBaseUrl } = cfg;
  if (p.startsWith("/")) return `${assetBaseUrl}${p}`;
  return `${assetBaseUrl}/${p}`;
}

export function sortNavCollections(items: VCollectionNav[]): VCollectionNav[] {
  return [...items]
    .map((row) => ({
      ...row,
      children: row.children?.length ? sortNavCollections(row.children) : row.children ?? [],
    }))
    .sort((a, b) => {
      const byPos = Number(a.position) - Number(b.position);
      if (byPos !== 0) return byPos;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

/** Prefer the NB storefront twin (higher id) for labels/children when slugs collide. */
function pickDisplayNavRoot(rows: VCollectionNav[]): VCollectionNav {
  return rows.reduce((best, row) => {
    const bestId = Number.parseInt(String(best.id), 10);
    const rowId = Number.parseInt(String(row.id), 10);
    if (Number.isFinite(bestId) && Number.isFinite(rowId) && rowId !== bestId) {
      return rowId > bestId ? row : best;
    }
    return best;
  });
}

/** Admin panel row (lower id) — its `position` defines the order admins see when reordering. */
function pickAdminCanonicalRoot(rows: VCollectionNav[]): VCollectionNav {
  return rows.reduce((best, row) => {
    const bestId = Number.parseInt(String(best.id), 10);
    const rowId = Number.parseInt(String(row.id), 10);
    if (Number.isFinite(bestId) && Number.isFinite(rowId) && rowId !== bestId) {
      return rowId < bestId ? row : best;
    }
    return best;
  });
}

/**
 * One row per slug for the storefront.
 * Order follows admin drag-and-drop (canonical lower-id row position + name tie-break).
 * Labels/children use the NB twin (higher id) for the Norwegian storefront.
 */
export function dedupeNavRootsBySlug(roots: VCollectionNav[]): VCollectionNav[] {
  const twinsBySlug = new Map<string, VCollectionNav[]>();
  for (const row of roots) {
    const twins = twinsBySlug.get(row.slug);
    if (twins) twins.push(row);
    else twinsBySlug.set(row.slug, [row]);
  }

  const sortRows = [...twinsBySlug.values()].map((twins) => {
    const admin = pickAdminCanonicalRoot(twins);
    return {
      display: pickDisplayNavRoot(twins),
      sortPos: Number(admin.position),
      sortName: admin.name,
    };
  });

  sortRows.sort((a, b) => {
    const byPos = a.sortPos - b.sortPos;
    if (byPos !== 0) return byPos;
    return a.sortName.localeCompare(b.sortName, undefined, { sensitivity: "base" });
  });

  return sortRows.map((row) => row.display);
}

/**
 * Slug → Norwegian name from the nav tree.
 * When EN/NB twins share a slug, keep the higher-id (NB storefront) row's name.
 */
export function buildNorwegianCategoryNameMap(roots: VCollectionNav[]): Map<string, string> {
  const bySlug = new Map<string, VCollectionNav>();
  const walk = (node: VCollectionNav) => {
    const prev = bySlug.get(node.slug);
    if (!prev || Number.parseInt(String(node.id), 10) > Number.parseInt(String(prev.id), 10)) {
      bySlug.set(node.slug, node);
    }
    for (const child of node.children ?? []) walk(child);
  };
  for (const root of roots) walk(root);
  return new Map([...bySlug.entries()].map(([slug, node]) => [slug, node.name]));
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
  return sortNavCollections(roots);
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

function formatNokAmount(locale: string, minor: number): string {
  const nok = minor / 100;
  const nf = Intl.NumberFormat(locale === "en" ? "en-GB" : "nb-NO", {
    maximumFractionDigits: 0,
  });
  return nf.format(nok).replace(/\u00a0/g, " ");
}

/** Full price line (label + amount + VAT note) — PDP, cart, search. */
export function formatNOKExclVatFromMinor(locale: string, minor: number | null): string {
  if (minor === null || !Number.isFinite(minor)) return "—";
  const amount = formatNokAmount(locale, minor);
  if (locale === "en") return ` NOK ${amount},- incl. VAT`;
  return ` kr ${amount},- inkl. MVA`;
}

/** Amount + VAT note only — product cards that already show a separate “From” label. */
export function formatNOKExclVatCardAmount(locale: string, minor: number | null): string {
  if (minor === null || !Number.isFinite(minor)) return "—";
  const amount = formatNokAmount(locale, minor);
  if (locale === "en") return `NOK ${amount},- incl. VAT`;
  return `kr ${amount},- inkl. MVA`;
}
