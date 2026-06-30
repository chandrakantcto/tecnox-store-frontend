"use client";

import { useMemo } from "react";
import { useVatDisplay } from "@/contexts/VatDisplayContext";
import { useActiveLocale } from "@/hooks/use-active-locale";
import {
  cartSubtotalLabel,
  cartTotalLabel,
  checkoutAmountLabel,
  checkoutTotalLabel,
  formatStorefrontMajorKr,
  formatStorefrontMinorCardPrice,
  formatStorefrontMinorPrice,
  majorInclTaxToDisplayMajor,
  subtotalLabel,
  vatNoteLabel,
} from "@/lib/vat-display";

export function useStorefrontPrice() {
  const locale = useActiveLocale();
  const { vatIncluded } = useVatDisplay();

  return useMemo(
    () => ({
      vatIncluded,
      formatMinorPrice: (minorInclTax: number | null) =>
        formatStorefrontMinorPrice(locale, minorInclTax, vatIncluded),
      formatCardPrice: (minorInclTax: number | null) =>
        formatStorefrontMinorCardPrice(locale, minorInclTax, vatIncluded),
      formatMajorKr: (majorInclTax: number) =>
        formatStorefrontMajorKr(locale, majorInclTax, vatIncluded),
      displayMajorKr: (majorInclTax: number) =>
        majorInclTaxToDisplayMajor(majorInclTax, vatIncluded),
      vatNote: vatNoteLabel(locale, vatIncluded),
      subtotalLabel: subtotalLabel(locale, vatIncluded),
      cartSubtotalLabel: cartSubtotalLabel(locale, vatIncluded),
      cartTotalLabel: cartTotalLabel(locale, vatIncluded),
      checkoutTotalLabel: checkoutTotalLabel(locale, vatIncluded),
      checkoutAmountLabel: checkoutAmountLabel(locale, vatIncluded),
    }),
    [locale, vatIncluded],
  );
}
