"use client";

import { CartProvider } from "@/contexts/CartContext";
import { LocaleProvider, useLocale } from "@/contexts/LocaleContext";
import { ShopAuthProvider } from "@/contexts/ShopAuthContext";
import { VatDisplayProvider } from "@/contexts/VatDisplayContext";
import type { Locale } from "@/lib/locale";

function AuthAndCartProviders({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return (
    <ShopAuthProvider locale={locale}>
      <CartProvider locale={locale}>{children}</CartProvider>
    </ShopAuthProvider>
  );
}

export function Providers({
  locale,
  initialVatIncluded = true,
  children,
}: {
  locale: Locale;
  initialVatIncluded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider locale={locale}>
      <VatDisplayProvider initialVatIncluded={initialVatIncluded}>
        <AuthAndCartProviders>{children}</AuthAndCartProviders>
      </VatDisplayProvider>
    </LocaleProvider>
  );
}
