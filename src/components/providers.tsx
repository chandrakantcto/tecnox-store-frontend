"use client";

import { CartProvider } from "@/contexts/CartContext";
import { ShopAuthProvider } from "@/contexts/ShopAuthContext";
import type { Locale } from "@/lib/locale";

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <ShopAuthProvider locale={locale}>
      <CartProvider locale={locale}>{children}</CartProvider>
    </ShopAuthProvider>
  );
}
