/** Variant counts belonging only to each collection row (excluding descendants); build from flattened Shop API query */
export type DirectVariantCounts = Map<string, Set<string>>;

/** Subtree sum: each node's direct variants + totals of descendants (matches expected “products in branch”) */
export function subtreeVariantRollup(nav: DirectVariantCountsLookupNode, directCounts: DirectVariantCounts): Set<string> {
  const merged = new Set<string>();
  const direct = directCounts.get(nav.id);
  if (direct) {
    for (const pid of direct) merged.add(pid);
  }
  const kids = nav.children ?? [];
  for (const ch of kids) {
    const chSet = subtreeVariantRollup(ch, directCounts);
    for (const pid of chSet) merged.add(pid);
  }
  return merged;
}

type DirectVariantCountsLookupNode = {
  id: string;
  children?: DirectVariantCountsLookupNode[];
};

export function rollupVariantTotalsFromCounts(nav: DirectVariantCountsLookupNode, directCounts: DirectVariantCounts): number {
  return subtreeVariantRollup(nav, directCounts).size;
}
