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
  const fb = collectionLabelsForSlug(slug);
  if (fb) {
    return {
      nb: fb.nameNb || storeNb || storeEn || fallback,
      en: fb.nameEn || storeEn || storeNb || fallback,
    };
  }
  return {
    nb: storeNb || storeEn || fallback,
    en: storeEn || storeNb || fallback,
  };
}

export function collectionLabelForSlug(slug: string, locale: Locale): string | null {
  const row = collectionLabelsForSlug(slug);
  if (!row) return null;
  return tr(locale, row.nameNb, row.nameEn);
}
