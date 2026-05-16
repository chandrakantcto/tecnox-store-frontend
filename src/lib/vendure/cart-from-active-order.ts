import { absoluteAssetUrl, inferBrandFromSku, minorUnitsFromMoney } from "./normalize";

export type VendureCartLine = {
  orderLineId: string;
  variantId: string;
  quantity: number;
  productSlug: string;
  productName: string;
  brand: string;
  spec: string;
  /** Major currency units (NOK kr) excluding tax — matches PDP “eks. MVA”. */
  unitPriceKr: number;
  lineTotalKr: number;
  imageSrc: string;
};

function krFromMinor(money: unknown): number {
  const minor = minorUnitsFromMoney(money);
  return minor !== null ? minor / 100 : 0;
}

export function cartLinesFromActiveOrder(
  raw: unknown,
  inferBrand: (sku: string | undefined | null) => string = inferBrandFromSku,
): VendureCartLine[] {
  if (!raw || typeof raw !== "object") return [];
  const lines = Array.isArray((raw as Record<string, unknown>).lines)
    ? ((raw as Record<string, unknown>).lines as unknown[])
    : [];

  const out: VendureCartLine[] = [];

  for (const lineRaw of lines) {
    if (!lineRaw || typeof lineRaw !== "object") continue;
    const line = lineRaw as Record<string, unknown>;
    const orderLineId = typeof line.id === "string" || typeof line.id === "number" ? String(line.id) : "";
    if (!orderLineId) continue;

    const qty =
      typeof line.quantity === "number" && Number.isFinite(line.quantity) ? Math.max(0, line.quantity) : 0;

    const pvRaw = line.productVariant;
    if (!pvRaw || typeof pvRaw !== "object") continue;
    const pv = pvRaw as Record<string, unknown>;
    const variantId = typeof pv.id === "string" || typeof pv.id === "number" ? String(pv.id) : "";

    const prodRaw = pv.product;
    const prod = prodRaw && typeof prodRaw === "object" ? (prodRaw as Record<string, unknown>) : null;
    const productSlug =
      prod && typeof prod.slug === "string" && prod.slug.trim().length > 0 ? prod.slug.trim() : "ukjent-produkt";
    const productName =
      prod && typeof prod.name === "string" && prod.name.trim().length > 0 ? prod.name.trim() : String(pv.name ?? "Produkt");

    const sku = typeof pv.sku === "string" ? pv.sku : "";
    const variantName = typeof pv.name === "string" ? pv.name.trim() : "";
    const spec = variantName || (sku ? `SKU ${sku}` : "");

    const preview =
      pv.featuredAsset && typeof pv.featuredAsset === "object"
        ? String((pv.featuredAsset as Record<string, unknown>).preview ?? "").trim()
        : "";
    const imageSrc =
      preview ? absoluteAssetUrl(preview) ?? "" : "";

    const lineTotalKr =
      krFromMinor(line.discountedLinePrice ?? line.linePrice);
    let unitPriceKr = krFromMinor(line.discountedUnitPrice);
    if (!unitPriceKr && qty > 0) {
      unitPriceKr = lineTotalKr / qty;
    }

    const brand =
      sku ? inferBrand(sku) : variantName.includes(" ") ? variantName.slice(0, 12).toUpperCase() : "TECNOX";

    out.push({
      orderLineId,
      variantId,
      quantity: qty,
      productSlug,
      productName,
      brand,
      spec,
      unitPriceKr,
      lineTotalKr,
      imageSrc: imageSrc.trim(),
    });
  }

  return out;
}

export function orderSubtotalExTaxKr(order: unknown): number {
  if (!order || typeof order !== "object") return 0;
  return krFromMinor((order as Record<string, unknown>).subTotal);
}

export function orderTotalQuantity(order: unknown): number {
  if (!order || typeof order !== "object") return 0;
  const n = (order as Record<string, unknown>).totalQuantity;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}
