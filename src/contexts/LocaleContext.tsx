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
import { useRouter } from "next/navigation";
import { pickLocale, setClientLocale, type Locale } from "@/lib/locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale: serverLocale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(() => pickLocale(serverLocale));

  useEffect(() => {
    setLocaleState(pickLocale(serverLocale));
  }, [serverLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setClientLocale(next);
      setLocaleState(next);
      if (typeof document !== "undefined") {
        document.documentElement.lang = next;
      }
      router.refresh();
    },
    [locale, router],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
