"use client";

import { useEffect, useMemo, useState } from "react";
import type { MegaMain } from "@/data/megaMenu";
import { GQL_SEARCH_PRODUCTS } from "@/lib/vendure/queries";
import {
  formatNOKExclVatFromMinor,
  priceMinorFromHit,
  validateSearchPayload,
  type SearchHitRaw,
} from "@/lib/vendure/normalize";
import type { Locale } from "@/lib/locale";

export type CategorySearchHit = {
  slug: string;
  label: string;
  path: string;
};

const DEBOUNCE_MS = 280;
const MAX_CATEGORY_SUGGESTIONS = 8;
const MAX_PRODUCT_SUGGESTIONS = 8;

export function flattenMegaMenuForSearch(roots: MegaMain[]): CategorySearchHit[] {
  const out: CategorySearchHit[] = [];
  for (const main of roots) {
    out.push({ slug: main.id, label: main.label, path: main.label });
    for (const sub of main.subs) {
      out.push({
        slug: sub.id,
        label: sub.label,
        path: `${main.label} › ${sub.label}`,
      });
      for (const leaf of sub.children ?? []) {
        out.push({
          slug: leaf.id,
          label: leaf.label,
          path: `${main.label} › ${sub.label} › ${leaf.label}`,
        });
      }
    }
  }
  return out;
}

function filterCategories(rows: CategorySearchHit[], term: string): CategorySearchHit[] {
  const t = term.trim().toLowerCase();
  if (t.length < 1) return [];
  return rows
    .filter(
      (r) =>
        r.label.toLowerCase().includes(t) ||
        r.slug.toLowerCase().includes(t) ||
        r.path.toLowerCase().includes(t),
    )
    .slice(0, MAX_CATEGORY_SUGGESTIONS);
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function exVatMinorFromInclusiveMinor(minorInclusive: number | null): number | null {
  if (minorInclusive === null || !Number.isFinite(minorInclusive)) return null;
  return Math.round(minorInclusive / 1.25);
}

export function useStorefrontSearch(locale: Locale, megaTree: MegaMain[]) {
  const lc = locale === "en" ? "en" : "nb";
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, DEBOUNCE_MS);
  const flatCategories = useMemo(() => flattenMegaMenuForSearch(megaTree), [megaTree]);
  const categoryHits = useMemo(() => filterCategories(flatCategories, query), [flatCategories, query]);

  const [productHits, setProductHits] = useState<SearchHitRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = debounced.trim();
    if (term.length < 1) {
      setProductHits([]);
      setError(null);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/vendure/shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({
            query: GQL_SEARCH_PRODUCTS,
            variables: {
              input: {
                term,
                groupByProduct: true,
                take: MAX_PRODUCT_SUGGESTIONS,
                skip: 0,
              },
            },
            locale: lc,
          }),
        });
        const json = (await res.json()) as {
          data?: unknown;
          errors?: { message?: string }[];
        };
        if (ac.signal.aborted) return;
        if (json.errors?.length) {
          setProductHits([]);
          setError(json.errors.map((e) => e.message).join("; ") || "Search failed");
          return;
        }
        const data = json.data as { search?: unknown } | undefined;
        const { hits } = validateSearchPayload(data ?? {});
        setProductHits(hits);
      } catch (e) {
        if (ac.signal.aborted) return;
        setProductHits([]);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [debounced, lc]);

  const clearQuery = () => {
    setQuery("");
    setProductHits([]);
    setError(null);
  };

  /** Price label for dropdown rows (excl. VAT, consistent with catalog cards). */
  const formatHitPrice = (hit: SearchHitRaw) => {
    const inc = priceMinorFromHit(hit.priceWithTax);
    const ex = exVatMinorFromInclusiveMinor(inc);
    return formatNOKExclVatFromMinor(lc, ex);
  };

  return {
    query,
    setQuery,
    debouncedTerm: debounced.trim(),
    categoryHits,
    productHits,
    loading,
    error,
    clearQuery,
    formatHitPrice,
  };
}

export type StorefrontSearchApi = ReturnType<typeof useStorefrontSearch>;
