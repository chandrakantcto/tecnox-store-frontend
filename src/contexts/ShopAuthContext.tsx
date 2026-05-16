"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { errorMessageFromShopResult, getStoredShopAuthToken, shopGraphql } from "@/lib/vendure/shop-client-browser";
import { GQL_ACTIVE_CUSTOMER_PANEL, GQL_LOGOUT } from "@/lib/vendure/shop-auth-documents";

export type ShopCustomerBrief = {
  id: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
};

type ActivePanelData = {
  activeCustomer:
    | {
        id: unknown;
        emailAddress?: unknown;
        firstName?: unknown;
        lastName?: unknown;
        phoneNumber?: unknown | null;
      }
    | null
    | undefined;
  me: { id: unknown } | null | undefined;
};

function parseCustomer(data: ActivePanelData | null | undefined): ShopCustomerBrief | null {
  const c = data?.activeCustomer;
  if (!c || typeof c !== "object") return null;
  const id = typeof c.id === "string" || typeof c.id === "number" ? String(c.id) : "";
  if (!id) return null;
  const email = typeof c.emailAddress === "string" ? c.emailAddress.trim().toLowerCase() : "";
  const fn = typeof c.firstName === "string" ? c.firstName : "";
  const ln = typeof c.lastName === "string" ? c.lastName : "";
  const ph = typeof c.phoneNumber === "string" ? c.phoneNumber : null;
  if (!email) return null;
  return { id, emailAddress: email, firstName: fn, lastName: ln, phoneNumber: ph };
}

type ShopAuthValue = {
  locale: string;
  /** Undefined until first bootstrap finished */
  initializing: boolean;
  customer: ShopCustomerBrief | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const ShopAuthContext = createContext<ShopAuthValue | null>(null);

export function ShopAuthProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const lc = locale === "en" ? "en" : "nb";
  const [initializing, setInitializing] = useState(true);
  const [customer, setCustomer] = useState<ShopCustomerBrief | null>(null);

  const refresh = useCallback(async () => {
    const token = getStoredShopAuthToken();
    if (!token) {
      setCustomer(null);
      return;
    }
    const res = await shopGraphql<ActivePanelData>(GQL_ACTIVE_CUSTOMER_PANEL, undefined, lc);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer) {
      setCustomer(null);
      return;
    }
    const me = res.data?.me;
    if (!me || typeof me !== "object" || (typeof me.id !== "string" && typeof me.id !== "number")) {
      setCustomer(null);
      return;
    }
    setCustomer(parseCustomer(res.data ?? undefined));
  }, [lc]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setInitializing(true);
      await refresh();
      if (!cancelled) setInitializing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    const token = getStoredShopAuthToken();
    if (token) {
      await shopGraphql<{ logout: { success?: boolean } | null }>(GQL_LOGOUT, undefined, lc);
    }
    try {
      if (typeof window !== "undefined") {
        const { setStoredShopAuthToken } = await import("@/lib/vendure/shop-client-browser");
        setStoredShopAuthToken(null);
      }
    } catch {
      /* ignore */
    }
    setCustomer(null);
    await refresh();
  }, [lc, refresh]);

  const value = useMemo(
    (): ShopAuthValue => ({
      locale: lc,
      initializing,
      customer,
      refresh,
      logout,
    }),
    [lc, initializing, customer, refresh, logout],
  );

  return <ShopAuthContext.Provider value={value}>{children}</ShopAuthContext.Provider>;
}

export function useShopAuth(): ShopAuthValue {
  const ctx = useContext(ShopAuthContext);
  if (!ctx) throw new Error("useShopAuth must be used within ShopAuthProvider");
  return ctx;
}
