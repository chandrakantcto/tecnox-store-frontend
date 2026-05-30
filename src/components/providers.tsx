"use client";

import { CartProvider } from "@/contexts/CartContext";
import { LocaleProvider, useLocale } from "@/contexts/LocaleContext";
import { ShopAuthProvider } from "@/contexts/ShopAuthContext";
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
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider locale={locale}>
      <AuthAndCartProviders>{children}</AuthAndCartProviders>
    </LocaleProvider>
  );
}
