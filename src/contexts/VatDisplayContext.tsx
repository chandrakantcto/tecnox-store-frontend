"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { VAT_DISPLAY_COOKIE } from "@/lib/vat-display";

type VatDisplayContextValue = {
  vatIncluded: boolean;
  setVatIncluded: (included: boolean) => void;
};

const VatDisplayContext = createContext<VatDisplayContextValue | null>(null);

function persistVatIncluded(included: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${VAT_DISPLAY_COOKIE}=${included ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
}

export function VatDisplayProvider({
  initialVatIncluded = true,
  children,
}: {
  initialVatIncluded?: boolean;
  children: ReactNode;
}) {
  const [vatIncluded, setVatIncludedState] = useState(initialVatIncluded);

  const setVatIncluded = useCallback((included: boolean) => {
    setVatIncludedState(included);
    persistVatIncluded(included);
  }, []);

  const value = useMemo(
    () => ({ vatIncluded, setVatIncluded }),
    [vatIncluded, setVatIncluded],
  );

  return <VatDisplayContext.Provider value={value}>{children}</VatDisplayContext.Provider>;
}

export function useVatDisplay(): VatDisplayContextValue {
  const ctx = useContext(VatDisplayContext);
  if (!ctx) throw new Error("useVatDisplay must be used within VatDisplayProvider");
  return ctx;
}
