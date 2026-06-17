import type { OrderConfirmationEmailData, OrderConfirmationLine } from "@/lib/email/order-confirmation-email-template";
import type { VerifiedShopCustomer, VerifiedShopOrder } from "@/lib/auth/shop-request-auth";
import { absoluteAssetUrl } from "@/lib/vendure/normalize";
import type { Locale } from "@/lib/locale";

function minorToKr(minor: number): number {
  return minor / 100;
}

function lineUnitMinor(line: VerifiedShopOrder["lines"][number]): number {
  const unit = line.discountedUnitPriceWithTax ?? line.unitPriceWithTax;
  if (typeof unit === "number" && unit > 0) return unit;
  const total = line.discountedLinePriceWithTax ?? line.linePriceWithTax;
  if (line.quantity > 0) return Math.round(total / line.quantity);
  return 0;
}

export function orderEmailLinesFromShopOrder(order: VerifiedShopOrder): OrderConfirmationLine[] {
  return order.lines.map((line) => {
    const pv = line.productVariant;
    const name = pv.product?.name?.trim() || pv.name?.trim() || "Produkt";
    const preview = pv.featuredAsset?.preview;
    const imageUrl = preview ? absoluteAssetUrl(preview) ?? undefined : undefined;
    const lineTotalKr = minorToKr(line.discountedLinePriceWithTax ?? line.linePriceWithTax);
    const unitPriceKr = minorToKr(lineUnitMinor(line));

    return {
      productName: name,
      spec: pv.sku ? `SKU ${pv.sku}` : undefined,
      quantity: line.quantity,
      unitPriceKr,
      lineTotalKr,
      imageUrl,
    };
  });
}

export function formatOrderEmailDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return new Date().toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatOrderEmailDate(null, locale);
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildOrderConfirmationEmailData(
  customer: VerifiedShopCustomer,
  order: VerifiedShopOrder,
  locale: Locale,
): OrderConfirmationEmailData {
  const addr = order.shippingAddress ?? {};
  const fullName =
    addr.fullName?.trim() || `${customer.firstName} ${customer.lastName}`.trim();

  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.emailAddress,
    orderCode: order.code,
    orderDate: formatOrderEmailDate(order.orderPlacedAt ?? order.createdAt, locale),
    shippingAddress: {
      fullName,
      streetLine1: addr.streetLine1?.trim() || "—",
      streetLine2: addr.streetLine2?.trim() || undefined,
      city: addr.city?.trim() || "—",
      postalCode: addr.postalCode?.trim() || "—",
      countryCode: addr.countryCode?.trim() || "NO",
      phoneNumber: addr.phoneNumber?.trim() || undefined,
    },
    lines: orderEmailLinesFromShopOrder(order),
    totalWithTaxKr: minorToKr(order.totalWithTax),
  };
}
