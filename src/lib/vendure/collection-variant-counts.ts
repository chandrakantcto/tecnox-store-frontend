/** Variant counts belonging only to each collection row (excluding descendants); build from flattened Shop API query */
export type DirectVariantCounts = Map<string, number>;

/** Subtree sum: each node's direct variants + totals of descendants (matches expected “products in branch”) */
export function subtreeVariantRollup(nav: DirectVariantCountsLookupNode, directCounts: DirectVariantCounts): number {
  let n = directCounts.get(nav.id) ?? 0;
  const kids = nav.children ?? [];
  for (const ch of kids) {
    n += subtreeVariantRollup(ch, directCounts);
  }
  return n;
}

type DirectVariantCountsLookupNode = {
  id: string;
  children?: DirectVariantCountsLookupNode[];
};

export function rollupVariantTotalsFromCounts(nav: DirectVariantCountsLookupNode, directCounts: DirectVariantCounts): number {
  return subtreeVariantRollup(nav, directCounts);
}
