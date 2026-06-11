import products from "../../seed/products.json";

type VariantSeedRow = {
  sku: string;
  nameNb: string;
  nameEn: string;
};

type ProductSeedRow = {
  slug: string;
  nameNb: string;
  nameEn: string;
  descriptionNb?: string;
  descriptionEn?: string;
  optionGroupCode?: string;
  optionGroupNameNb?: string;
  optionGroupNameEn?: string;
  variants?: VariantSeedRow[];
};

const productsList = products as ProductSeedRow[];

const BY_SLUG = new Map<string, ProductSeedRow>(productsList.map((row) => [row.slug, row]));

const BY_SKU = new Map<string, { nameNb: string; nameEn: string }>();
for (const product of productsList) {
  for (const variant of product.variants ?? []) {
    BY_SKU.set(variant.sku, { nameNb: variant.nameNb, nameEn: variant.nameEn });
  }
}

export function productLabelsForSlug(slug: string): ProductSeedRow | null {
  return BY_SLUG.get(slug) ?? null;
}

export function resolveProductDisplayNames(
  slug: string,
  storeNb: string,
  storeEn: string,
  fallback: string,
): { nb: string; en: string } {
  const fb = BY_SLUG.get(slug);
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

export function resolveProductDescriptions(
  slug: string,
  storeNb: string,
  storeEn: string,
  fallback: string,
): { nb: string; en: string } {
  const fb = BY_SLUG.get(slug);
  if (fb) {
    const descNb = fb.descriptionNb?.trim() || storeNb.trim() || fallback;
    const descEn = fb.descriptionEn?.trim() || storeEn.trim() || fallback;
    return { nb: descNb, en: descEn };
  }
  return {
    nb: storeNb.trim() || fallback,
    en: storeEn.trim() || fallback,
  };
}

export function variantLabelsForSku(sku: string): { nameNb: string; nameEn: string } | null {
  return BY_SKU.get(sku) ?? null;
}

export function optionGroupLabelsForProductSlug(
  slug: string,
): { nameNb: string; nameEn: string } | null {
  const row = BY_SLUG.get(slug);
  if (!row?.optionGroupNameNb?.trim()) return null;
  return {
    nameNb: row.optionGroupNameNb,
    nameEn: row.optionGroupNameEn?.trim() || row.optionGroupNameNb,
  };
}
