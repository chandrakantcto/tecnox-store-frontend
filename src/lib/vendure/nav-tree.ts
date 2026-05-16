import type { MegaLeaf, MegaMain, MegaSub } from "@/data/megaMenu";
import {
  rollupVariantTotalsFromCounts,
  type DirectVariantCounts,
} from "@/lib/vendure/collection-variant-counts";
import type { VCollectionNav } from "@/lib/vendure/normalize";

function branchToMegaSub(mid: VCollectionNav): MegaSub {
  const leaves = mid.children ?? [];
  if (leaves.length === 0) {
    return { id: mid.slug, label: mid.name };
  }
  return {
    id: mid.slug,
    label: mid.name,
    children: leaves.map<MegaLeaf>((leaf) => ({
      id: leaf.slug,
      label: leaf.name,
    })),
  };
}

/** Mega menu counts roll up descendant collections using flat direct-count map from Shop API */
export function navCollectionsToMegaMains(
  navRoots: VCollectionNav[],
  directCounts: DirectVariantCounts,
): MegaMain[] {
  return navRoots.map((root) => {
    const subs: MegaSub[] = (root.children ?? []).map((mid) => branchToMegaSub(mid));
    return {
      id: root.slug,
      label: root.name,
      count: rollupVariantTotalsFromCounts(root, directCounts),
      subs,
    };
  });
}
