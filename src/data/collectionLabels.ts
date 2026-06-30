import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { rootCategoryLabelsForSlug } from "@/data/rootCategoryLabels";
import collectionTree from "../../seed/collections-tree.json";

type CollectionTreeRow = {
  id: string;
  nameNb: string;
  nameEn: string;
};

const BY_SLUG = new Map<string, { nameNb: string; nameEn: string }>(
  (collectionTree as CollectionTreeRow[]).map((row) => [
    row.id,
    { nameNb: row.nameNb, nameEn: row.nameEn },
  ]),
);

/** NB/EN labels for any collection slug (seed tree + root fallbacks). */
export function collectionLabelsForSlug(slug: string): { nameNb: string; nameEn: string } | null {
  const root = rootCategoryLabelsForSlug(slug);
  if (root) return root;
  return BY_SLUG.get(slug) ?? null;
}

export function resolveCollectionDisplayNames(
  slug: string,
  storeNb: string,
  storeEn: string,
  fallback: string,
): { nb: string; en: string } {
  const seed = BY_SLUG.get(slug);
  const rootFb = rootCategoryLabelsForSlug(slug);
  const nb =
    storeNb.trim() ||
    seed?.nameNb.trim() ||
    rootFb?.nameNb ||
    fallback;
  const en =
    storeEn.trim() ||
    storeNb.trim() ||
    seed?.nameEn ||
    rootFb?.nameEn ||
    fallback;
  return { nb, en };
}

/** Norwegian-only storefront label — never falls back to English. */
export function storefrontNorwegianCategoryName(
  slug: string,
  nbNames: Map<string, string>,
  fallback = "",
): string {
  const fromVendure = nbNames.get(slug)?.trim();
  if (fromVendure) return fromVendure;
  const seed = BY_SLUG.get(slug);
  if (seed?.nameNb.trim()) return seed.nameNb.trim();
  const rootFb = rootCategoryLabelsForSlug(slug);
  if (rootFb?.nameNb.trim()) return rootFb.nameNb.trim();
  return fallback.trim();
}

export function collectionLabelForSlug(slug: string, locale: Locale): string | null {
  const row = collectionLabelsForSlug(slug);
  if (!row) return null;
  return tr(locale, row.nameNb, row.nameEn);
}
