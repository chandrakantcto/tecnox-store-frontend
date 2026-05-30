/**
 * Mega menu tree shape for «Produkter» (column 1 → 2 → 3).
 * Runtime data is built from Vendure collections only (`navCollectionsToMegaMains`).
 */
export type MegaLeaf = {
  /** Vendure collection id — unique React key */
  collectionId: string;
  /** Collection slug — used in category URLs */
  id: string;
  label: string;
};

export type MegaSub = {
  collectionId: string;
  id: string;
  label: string;
  children?: MegaLeaf[];
};

export type MegaMain = {
  collectionId: string;
  id: string;
  label: string;
  count: number;
  subs: MegaSub[];
};
