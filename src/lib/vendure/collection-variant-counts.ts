/** Direct variant counts per collection id (flat Shop API query; excludes descendant rollup). */
export type DirectVariantCounts = Map<string, number>;

type DirectVariantCountsLookupNode = {
  id: string;
  children?: DirectVariantCountsLookupNode[];
};

/** Subtree sum: each node's direct variants + totals of descendants. */
export function rollupVariantTotalsFromCounts(
  nav: DirectVariantCountsLookupNode,
  directCounts: DirectVariantCounts,
): number {
  let total = directCounts.get(nav.id) ?? 0;
  for (const ch of nav.children ?? []) {
    total += rollupVariantTotalsFromCounts(ch, directCounts);
  }
  return total;
}
