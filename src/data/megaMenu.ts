/**
 * Mega menu tree shape for «Produkter» (column 1 → 2 → 3).
 * Runtime data is built from Vendure collections only (`navCollectionsToMegaMains`).
 */
export type MegaLeaf = {
  id: string;
  label: string;
};

export type MegaSub = {
  id: string;
  label: string;
  children?: MegaLeaf[];
};

export type MegaMain = {
  id: string;
  label: string;
  count: number;
  subs: MegaSub[];
};
