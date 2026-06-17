/** User-facing brand name — display, SEO, and emails only. Not for IDs, storage keys, or API logic. */
export const BRAND_NAME = "Tecno X";
export const BRAND_LEGAL_NAME = "Tecno X AS";

/** Map internal/store brand labels (e.g. SKU prefix "TECNOX") to the storefront display name. */
export function displayBrandName(brand: string | null | undefined): string {
  if (!brand?.trim()) return BRAND_NAME;
  const compact = brand.trim().toUpperCase().replace(/\s+/g, "");
  if (compact === "TECNOX") return BRAND_NAME;
  return brand.trim();
}
