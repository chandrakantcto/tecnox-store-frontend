import { tr, type Locale } from "@/lib/locale";

/** Norwegian standard VAT rate used for storefront display toggles. */
export const VAT_RATE = 0.25;

export const VAT_DISPLAY_COOKIE = "storefront-vat-included";

function formatNokAmount(locale: Locale, minor: number): string {
  const nok = minor / 100;
  const nf = Intl.NumberFormat(locale === "en" ? "en-GB" : "nb-NO", {
    maximumFractionDigits: 0,
  });
  return nf.format(nok).replace(/\u00a0/g, " ");
}

export function pickVatIncluded(value: string | null | undefined): boolean {
  if (value === "0" || value === "false") return false;
  return true;
}

export function minorInclTaxToDisplayMinor(minorInclTax: number, vatIncluded: boolean): number {
  if (vatIncluded) return minorInclTax;
  return Math.round(minorInclTax / (1 + VAT_RATE));
}

export function majorInclTaxToDisplayMajor(majorInclTax: number, vatIncluded: boolean): number {
  if (vatIncluded) return majorInclTax;
  return majorInclTax / (1 + VAT_RATE);
}

/** Product card / compact price (e.g. listing grids). */
export function formatStorefrontMinorCardPrice(
  locale: Locale,
  minorInclTax: number | null,
  vatIncluded: boolean,
): string {
  if (minorInclTax === null || !Number.isFinite(minorInclTax)) return "—";
  const amount = formatNokAmount(locale, minorInclTaxToDisplayMinor(minorInclTax, vatIncluded));
  const suffix = vatIncluded
    ? tr(locale, "inkl. MVA", "incl. VAT")
    : tr(locale, "eks. MVA", "excl. VAT");
  if (locale === "en") return `NOK ${amount},- ${suffix}`;
  return `kr ${amount},- ${suffix}`;
}

/** PDP / search row price line. */
export function formatStorefrontMinorPrice(
  locale: Locale,
  minorInclTax: number | null,
  vatIncluded: boolean,
): string {
  if (minorInclTax === null || !Number.isFinite(minorInclTax)) return "—";
  const amount = formatNokAmount(locale, minorInclTaxToDisplayMinor(minorInclTax, vatIncluded));
  if (locale === "en") {
    const suffix = vatIncluded ? "incl. VAT" : "excl. VAT";
    return ` NOK ${amount},- ${suffix}`;
  }
  const suffix = vatIncluded ? "inkl. MVA" : "eks. MVA";
  return ` kr ${amount},- ${suffix}`;
}

/** Cart / checkout totals stored as major NOK kr (incl. tax from Vendure). */
export function formatStorefrontMajorKr(
  locale: Locale,
  majorInclTax: number,
  vatIncluded: boolean,
): string {
  const display = majorInclTaxToDisplayMajor(majorInclTax, vatIncluded);
  return `${new Intl.NumberFormat(locale === "en" ? "en-GB" : "nb-NO").format(Math.round(display))},-`;
}

export function vatNoteLabel(locale: Locale, vatIncluded: boolean): string {
  return vatIncluded
    ? tr(locale, "inkl. MVA", "incl. VAT")
    : tr(locale, "eks. MVA", "excl. VAT");
}

export function subtotalLabel(locale: Locale, vatIncluded: boolean): string {
  return vatIncluded
    ? tr(locale, "Sum inkl. MVA", "Subtotal (incl. VAT)")
    : tr(locale, "Sum eks. MVA", "Subtotal (excl. VAT)");
}

export function cartSubtotalLabel(locale: Locale, vatIncluded: boolean): string {
  return vatIncluded
    ? tr(locale, "Delsum (inkl. MVA)", "Subtotal (incl. VAT)")
    : tr(locale, "Delsum (eks. MVA)", "Subtotal (excl. VAT)");
}

export function cartTotalLabel(locale: Locale, vatIncluded: boolean): string {
  return vatIncluded
    ? tr(locale, "Total (inkl. MVA)", "Total (incl. VAT)")
    : tr(locale, "Total (eks. MVA)", "Total (excl. VAT)");
}

export function checkoutTotalLabel(locale: Locale, vatIncluded: boolean): string {
  return vatIncluded
    ? tr(locale, "Total inkl. MVA", "Total incl. VAT")
    : tr(locale, "Total eks. MVA", "Total excl. VAT");
}

export function checkoutAmountLabel(locale: Locale, vatIncluded: boolean): string {
  return vatIncluded
    ? tr(locale, "Totalbeløp (inkl. MVA)", "Total amount (incl. VAT)")
    : tr(locale, "Totalbeløp (eks. MVA)", "Total amount (excl. VAT)");
}

export function topBarPricesLabel(locale: Locale, vatIncluded: boolean): string {
  return vatIncluded
    ? tr(locale, "Alle priser inkl. MVA", "All prices incl. VAT")
    : tr(locale, "Alle priser eks. MVA", "All prices excl. VAT");
}
