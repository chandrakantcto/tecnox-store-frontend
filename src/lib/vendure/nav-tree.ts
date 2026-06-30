import type { MegaLeaf, MegaMain, MegaSub } from "@/data/megaMenu";
import { storefrontNorwegianCategoryName } from "@/data/collectionLabels";
import type { DirectVariantCounts } from "@/lib/vendure/collection-variant-counts";
import { buildNorwegianCategoryNameMap, sortNavCollections, type VCollectionNav } from "@/lib/vendure/normalize";
import { tr, type Locale } from "@/lib/locale";

function branchToMegaSub(mid: VCollectionNav): MegaSub {
  const leaves = sortNavCollections(mid.children ?? []);
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

/** Mega menu column-1 count = number of direct subcategories shown in column 2 */
export function navCollectionsToMegaMains(
  navRoots: VCollectionNav[],
  _directCounts: DirectVariantCounts,
): MegaMain[] {
  return sortNavCollections(navRoots).map((root) => {
    const subs: MegaSub[] = sortNavCollections(root.children ?? []).map((mid) => branchToMegaSub(mid));
    return {
      collectionId: root.id,
      id: root.slug,
      label: root.name,
      count: subs.length,
      subs,
    };
  });
}

function flattenCollectionNames(roots: VCollectionNav[]): Map<string, string> {
  return buildNorwegianCategoryNameMap(roots);
}

function megaMenuLabel(
  slug: string,
  nodeName: string,
  nbNames: Map<string, string>,
  _enNames: Map<string, string>,
  locale: Locale,
): string {
  const nb = storefrontNorwegianCategoryName(slug, nbNames, nodeName);
  return tr(locale, nb, nb);
}

function branchToMegaSubLocalized(
  mid: VCollectionNav,
  nbNames: Map<string, string>,
  enNames: Map<string, string>,
  locale: Locale,
): MegaSub {
  const leaves = sortNavCollections(mid.children ?? []);
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
  _directCounts: DirectVariantCounts,
  nbRoots: VCollectionNav[],
  enRoots: VCollectionNav[],
  locale: Locale,
): MegaMain[] {
  const nbNames = flattenCollectionNames(nbRoots);
  const enNames = flattenCollectionNames(enRoots);
  return sortNavCollections(navRoots).map((root) => {
    const subs: MegaSub[] = sortNavCollections(root.children ?? []).map((mid) =>
      branchToMegaSubLocalized(mid, nbNames, enNames, locale),
    );
    return {
      collectionId: root.id,
      id: root.slug,
      label: megaMenuLabel(root.slug, root.name, nbNames, enNames, locale),
      count: subs.length,
      subs,
    };
  });
}
