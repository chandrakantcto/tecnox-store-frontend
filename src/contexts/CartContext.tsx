"use client";

import type { CartProductSnapshot } from "@/lib/catalog/storefront-product";
import {
  cartLinesFromActiveOrder,
  orderSubtotalWithTaxKr,
  orderTotalQuantity,
  type VendureCartLine,
} from "@/lib/vendure/cart-from-active-order";
import { errorMessageFromShopResult, shopGraphql } from "@/lib/vendure/shop-client-browser";
import { runCartMutationWithAddingItemsRecovery } from "@/lib/vendure/cart-mutation-recovery";
import {
  GQL_ACTIVE_ORDER,
  GQL_ADD_ITEM_TO_ORDER,
  GQL_ADJUST_ORDER_LINE,
  GQL_REMOVE_ORDER_LINE,
  GQL_REMOVE_ALL_ORDER_LINES,
} from "@/lib/vendure/shop-order-documents";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { pickLocale, tr, type Locale } from "@/lib/locale";

export type { VendureCartLine };

export function formatNOK(n: number): string {
  return `${new Intl.NumberFormat("nb-NO").format(n)},-`;
}

type ActiveOrderQueryResult = { activeOrder: unknown };

type CartActionResult = { ok: true } | { ok: false; message: string };

type CartContextValue = {
  locale: string;
  /** Order lines from `activeOrder`; empty when no draft cart in Vendure. */
  lines: VendureCartLine[];
  itemCount: number;
  subtotal: number;
  /** True until the first `activeOrder` fetch after mount. */
  loading: boolean;
  /** True while mutating cart (add / adjust / remove). */
  syncing: boolean;
  /** Last load or refresh error (e.g. API not configured). */
  bootstrapError: string | null;
  /** Last cart mutation error (toast-style). */
  lastActionError: string | null;
  clearLastActionError: () => void;
  /** Clears cached lines immediately (e.g. after checkout); followed by refresh to sync server. */
  clearCartOptimistic: () => void;
  refresh: () => Promise<void>;
  addItemFromSnapshot: (snapshot: CartProductSnapshot | null | undefined, qty?: number) => Promise<CartActionResult>;
  updateLineQuantity: (orderLineId: string, qty: number) => Promise<CartActionResult>;
  removeLine: (orderLineId: string) => Promise<CartActionResult>;
  emptyCart: () => Promise<CartActionResult>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readMutationError(payload: Record<string, unknown> | null | undefined, locale: Locale): string | null {
  if (!payload) return tr(locale, "Ugyldig svar fra butikk-API.", "Invalid response from storefront API.");
  const tn = typeof payload.__typename === "string" ? payload.__typename : "";
  if (tn === "Order") return null;
  const msg = typeof payload.message === "string" ? payload.message.trim() : "";
  if (msg) return msg;
  if (typeof payload.errorCode === "string" && payload.errorCode.trim()) return payload.errorCode.trim();
  return tn
    ? tr(locale, `Kunne ikke oppdatere handlekurven (${tn}).`, `Could not update the cart (${tn}).`)
    : tr(locale, "Kunne ikke oppdatere handlekurven.", "Could not update the cart.");
}

function pickMutationPayload(data: unknown, key: string): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const v = (data as Record<string, unknown>)[key];
  if (!v || typeof v !== "object") return null;
  return v as Record<string, unknown>;
}

export function CartProvider({
  children,
  locale = "nb",
}: {
  children: ReactNode;
  locale?: string;
}) {
  const lc = pickLocale(locale);
  const [order, setOrder] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [lastActionError, setLastActionError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lines = useMemo(() => cartLinesFromActiveOrder(order), [order]);
  const itemCount = useMemo(() => orderTotalQuantity(order), [order]);
  const subtotal = useMemo(() => orderSubtotalWithTaxKr(order), [order]);

  const refresh = useCallback(async () => {
    const res = await shopGraphql<ActiveOrderQueryResult>(GQL_ACTIVE_ORDER, undefined, lc);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer) {
      setBootstrapError(outer);
      setOrder(null);
      return;
    }
    setBootstrapError(null);
    setOrder(res.data?.activeOrder ?? null);
  }, [lc]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, refresh]);

  const clearLastActionError = useCallback(() => setLastActionError(null), []);
  const clearCartOptimistic = useCallback(() => {
    setOrder(null);
    setBootstrapError(null);
  }, []);

  const addItemFromSnapshot = useCallback(
    async (snapshot: CartProductSnapshot | null | undefined, qty = 1): Promise<CartActionResult> => {
      if (!snapshot?.variantId?.trim()) {
        const msg = tr(
          lc,
          "Fant ikke produktvariant. Oppdater produktsiden eller velg en gyldig konfigurasjon før du legger i kurv.",
          "Product variant not found. Refresh the product page or choose a valid configuration before adding to cart.",
        );
        setLastActionError(msg);
        return { ok: false, message: msg };
      }
      const productVariantId = snapshot.variantId.trim();
      if (qty < 1) return { ok: true };
      setSyncing(true);
      setLastActionError(null);
      const res = await runCartMutationWithAddingItemsRecovery(lc, async () => {
        const r = await shopGraphql<{ addItemToOrder: unknown }>(
          GQL_ADD_ITEM_TO_ORDER,
          { productVariantId, quantity: qty },
          lc,
        );
        return {
          networkError: r.networkError,
          graphqlErrors: r.graphqlErrors,
          payload: pickMutationPayload(r.data, "addItemToOrder"),
        };
      });
      setSyncing(false);
      const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
      if (outer) {
        setLastActionError(outer);
        return { ok: false, message: outer };
      }
      const payload = res.payload;
      const err = readMutationError(payload, lc);
      if (err) {
        setLastActionError(err);
        return { ok: false, message: err };
      }
      await refresh();
      return { ok: true };
    },
    [lc, refresh],
  );

  const updateLineQuantity = useCallback(
    async (orderLineId: string, qty: number): Promise<CartActionResult> => {
      if (!orderLineId.trim()) return { ok: false, message: tr(lc, "Mangler linje-ID.", "Missing line ID.") };
      setSyncing(true);
      setLastActionError(null);
      if (qty <= 0) {
        const res = await runCartMutationWithAddingItemsRecovery(lc, async () => {
          const r = await shopGraphql<{ removeOrderLine: unknown }>(
            GQL_REMOVE_ORDER_LINE,
            { orderLineId },
            lc,
          );
          return {
            networkError: r.networkError,
            graphqlErrors: r.graphqlErrors,
            payload: pickMutationPayload(r.data, "removeOrderLine"),
          };
        });
        setSyncing(false);
        const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
        if (outer) {
          setLastActionError(outer);
          return { ok: false, message: outer };
        }
        const payload = res.payload;
        const err = readMutationError(payload, lc);
        if (err) {
          setLastActionError(err);
          return { ok: false, message: err };
        }
        await refresh();
        return { ok: true };
      }

      const adjRes = await runCartMutationWithAddingItemsRecovery(lc, async () => {
        const r = await shopGraphql<{ adjustOrderLine: unknown }>(
          GQL_ADJUST_ORDER_LINE,
          { orderLineId, quantity: qty },
          lc,
        );
        return {
          networkError: r.networkError,
          graphqlErrors: r.graphqlErrors,
          payload: pickMutationPayload(r.data, "adjustOrderLine"),
        };
      });
      setSyncing(false);
      const outerAdj = errorMessageFromShopResult(adjRes.networkError, adjRes.graphqlErrors);
      if (outerAdj) {
        setLastActionError(outerAdj);
        return { ok: false, message: outerAdj };
      }
      const payloadAdj = adjRes.payload;
      const errAdj = readMutationError(payloadAdj, lc);
      if (errAdj) {
        setLastActionError(errAdj);
        return { ok: false, message: errAdj };
      }
      await refresh();
      return { ok: true };
    },
    [lc, refresh],
  );

  const removeLine = useCallback(
    async (orderLineId: string) => updateLineQuantity(orderLineId, 0),
    [updateLineQuantity],
  );

  const emptyCart = useCallback(async (): Promise<CartActionResult> => {
    setSyncing(true);
    setLastActionError(null);
    const res = await runCartMutationWithAddingItemsRecovery(lc, async () => {
      const r = await shopGraphql<{ removeAllOrderLines: unknown }>(GQL_REMOVE_ALL_ORDER_LINES, undefined, lc);
      return {
        networkError: r.networkError,
        graphqlErrors: r.graphqlErrors,
        payload: pickMutationPayload(r.data, "removeAllOrderLines"),
      };
    });
    setSyncing(false);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer) {
      setLastActionError(outer);
      return { ok: false, message: outer };
    }
    const payload = res.payload;
        const err = readMutationError(payload, lc);
    if (err) {
      setLastActionError(err);
      return { ok: false, message: err };
    }
    await refresh();
    return { ok: true };
  }, [lc, refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      locale: lc,
      lines,
      itemCount,
      subtotal,
      loading,
      syncing,
      bootstrapError,
      lastActionError,
      clearLastActionError,
      clearCartOptimistic,
      refresh,
      addItemFromSnapshot,
      updateLineQuantity,
      removeLine,
      emptyCart,
      sidebarOpen,
      setSidebarOpen,
    }),
    [
      lc,
      lines,
      itemCount,
      subtotal,
      loading,
      syncing,
      bootstrapError,
      lastActionError,
      clearLastActionError,
      clearCartOptimistic,
      refresh,
      addItemFromSnapshot,
      updateLineQuantity,
      removeLine,
      emptyCart,
      sidebarOpen,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Nav badge — safe when provider is temporarily unavailable during RSC refresh. */
export function useCartItemCount(): number {
  return useContext(CartContext)?.itemCount ?? 0;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
