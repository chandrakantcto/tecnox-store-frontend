import { absoluteAssetUrl, inferBrandFromSku, minorUnitsFromMoney } from "./normalize";

export type VendureCartLine = {
  orderLineId: string;
  variantId: string;
  quantity: number;
  productSlug: string;
  productName: string;
  brand: string;
  spec: string;
  /** Major currency units (NOK kr) including tax — matches PDP “inkl. MVA”. */
  unitPriceKr: number;
  lineTotalKr: number;
  imageSrc: string;
};

function krFromMinor(money: unknown): number {
  const minor = minorUnitsFromMoney(money);
  return minor !== null ? minor / 100 : 0;
}

function assetPreviewRel(asset: unknown): string {
  if (!asset || typeof asset !== "object") return "";
  const row = asset as Record<string, unknown>;
  const preview = typeof row.preview === "string" ? row.preview.trim() : "";
  if (preview) return preview;
  const source = typeof row.source === "string" ? row.source.trim() : "";
  return source;
}

function resolveCartLineImageSrc(
  pv: Record<string, unknown>,
  prod: Record<string, unknown> | null,
): string {
  const variantRel = assetPreviewRel(pv.featuredAsset);
  if (variantRel) return absoluteAssetUrl(variantRel) ?? "";

  if (prod) {
    const productRel = assetPreviewRel(prod.featuredAsset);
    if (productRel) return absoluteAssetUrl(productRel) ?? "";

    const assets = Array.isArray(prod.assets) ? prod.assets : [];
    for (const asset of assets) {
      const rel = assetPreviewRel(asset);
      if (rel) return absoluteAssetUrl(rel) ?? "";
    }
  }

  return "";
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

    const imageSrc = resolveCartLineImageSrc(pv, prod);

    const lineTotalKr =
      krFromMinor(
        line.discountedLinePriceWithTax ??
          line.discountedLinePrice ??
          line.linePriceWithTax ??
          line.linePrice,
      );
    let unitPriceKr = krFromMinor(
      line.discountedUnitPriceWithTax ?? line.discountedUnitPrice,
    );
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

function orderLinesRaw(order: unknown): unknown[] {
  if (!order || typeof order !== "object") return [];
  const lines = (order as Record<string, unknown>).lines;
  return Array.isArray(lines) ? lines : [];
}

export function orderSubtotalWithTaxKr(order: unknown): number {
  if (!order || typeof order !== "object") return 0;
  const withTax = krFromMinor((order as Record<string, unknown>).subTotalWithTax);
  if (withTax > 0) return withTax;
  const exTax = orderSubtotalExTaxKr(order);
  if (exTax > 0) return exTax;

  let sum = 0;
  for (const lineRaw of orderLinesRaw(order)) {
    if (!lineRaw || typeof lineRaw !== "object") continue;
    const line = lineRaw as Record<string, unknown>;
    sum += krFromMinor(
      line.discountedLinePriceWithTax ??
        line.discountedLinePrice ??
        line.linePriceWithTax ??
        line.linePrice,
    );
  }
  return sum;
}

export function orderTotalQuantity(order: unknown): number {
  if (!order || typeof order !== "object") return 0;
  const n = (order as Record<string, unknown>).totalQuantity;
  if (typeof n === "number" && Number.isFinite(n) && n > 0) return n;

  let sum = 0;
  for (const lineRaw of orderLinesRaw(order)) {
    if (!lineRaw || typeof lineRaw !== "object") continue;
    const qty = (lineRaw as Record<string, unknown>).quantity;
    if (typeof qty === "number" && Number.isFinite(qty) && qty > 0) sum += qty;
  }
  return sum;
}
