import type { MegaLeaf, MegaMain, MegaSub } from "@/data/megaMenu";
import { resolveCollectionDisplayNames } from "@/data/collectionLabels";
import {
  rollupVariantTotalsFromCounts,
  type DirectVariantCounts,
} from "@/lib/vendure/collection-variant-counts";
import type { VCollectionNav } from "@/lib/vendure/normalize";
import { tr, type Locale } from "@/lib/locale";

function branchToMegaSub(mid: VCollectionNav): MegaSub {
  const leaves = mid.children ?? [];
  if (leaves.length === 0) {
    return { collectionId: mid.id, id: mid.slug, label: mid.name };
  }
  return {
    collectionId: mid.id,
    id: mid.slug,
    label: mid.name,
    children: leaves.map<MegaLeaf>((leaf) => ({
      collectionId: leaf.id,
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
      collectionId: root.id,
      id: root.slug,
      label: root.name,
      count: rollupVariantTotalsFromCounts(root, directCounts),
      subs,
    };
  });
}

function flattenCollectionNames(roots: VCollectionNav[]): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (node: VCollectionNav) => {
    map.set(node.slug, node.name);
    for (const child of node.children ?? []) walk(child);
  };
  for (const root of roots) walk(root);
  return map;
}

function megaMenuLabel(
  slug: string,
  fallback: string,
  nbNames: Map<string, string>,
  enNames: Map<string, string>,
  locale: Locale,
): string {
  const storeNb = nbNames.get(slug)?.trim() || "";
  const storeEn = enNames.get(slug)?.trim() || "";
  const { nb, en } = resolveCollectionDisplayNames(slug, storeNb, storeEn, fallback);
  return tr(locale, nb, en);
}

function branchToMegaSubLocalized(
  mid: VCollectionNav,
  nbNames: Map<string, string>,
  enNames: Map<string, string>,
  locale: Locale,
): MegaSub {
  const leaves = mid.children ?? [];
  if (leaves.length === 0) {
    return {
      collectionId: mid.id,
      id: mid.slug,
      label: megaMenuLabel(mid.slug, mid.name, nbNames, enNames, locale),
    };
  }
  return {
    collectionId: mid.id,
    id: mid.slug,
    label: megaMenuLabel(mid.slug, mid.name, nbNames, enNames, locale),
    children: leaves.map<MegaLeaf>((leaf) => ({
      collectionId: leaf.id,
      id: leaf.slug,
      label: megaMenuLabel(leaf.slug, leaf.name, nbNames, enNames, locale),
    })),
  };
}

/** Same tree shape for NB/EN; labels resolved from both locale fetches (matches catalog tiles). */
export function navCollectionsToMegaMainsForLocale(
  navRoots: VCollectionNav[],
  directCounts: DirectVariantCounts,
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
  locale: Locale,
): MegaMain[] {
  const nbNames = flattenCollectionNames(nbRoots);
  const enNames = flattenCollectionNames(enRoots);
  return navRoots.map((root) => {
    const subs: MegaSub[] = (root.children ?? []).map((mid) =>
      branchToMegaSubLocalized(mid, nbNames, enNames, locale),
    );
    return {
      collectionId: root.id,
      id: root.slug,
      label: megaMenuLabel(root.slug, root.name, nbNames, enNames, locale),
      count: rollupVariantTotalsFromCounts(root, directCounts),
      subs,
    };
  });
}
