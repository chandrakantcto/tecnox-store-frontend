"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CategorySearchHit } from "@/hooks/use-storefront-search";
import type { StorefrontSearchApi } from "@/hooks/use-storefront-search";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { absoluteAssetUrl } from "@/lib/vendure/normalize";
import type { SearchHitRaw } from "@/lib/vendure/normalize";
import { cn } from "@/lib/utils";
import { FolderOpen, Loader2, Package, Search, X } from "lucide-react";

function catListingHref(slug: string) {
  return `/produkter?cat=${encodeURIComponent(slug)}`;
}

function productHref(slug: string) {
  return `/produkter/${encodeURIComponent(slug)}`;
}

type SuggestionRowsProps = {
  locale: Locale;
  search: StorefrontSearchApi;
  activeIndex: number;
  onPick: () => void;
  setActiveIndex: (n: number) => void;
  /** Mobile: full-width panel under the input */
  panelVariant?: "desktop" | "mobile";
};

function SuggestionRows({
  locale,
  search,
  activeIndex,
  onPick,
  setActiveIndex,
  panelVariant = "desktop",
}: SuggestionRowsProps) {
  const { query, categoryHits, productHits, loading, error, debouncedTerm, formatHitPrice } = search;

  const q = query.trim();
  const showPanel = q.length >= 1 || loading;

  if (!showPanel) return null;

  const noResults =
    !loading &&
    q.length >= 1 &&
    debouncedTerm.length >= 1 &&
    categoryHits.length === 0 &&
    productHits.length === 0 &&
    !error;

  return (
    <div
      className={cn(
        "absolute top-full z-[90] mt-2 max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-[3px] border border-[var(--color-divider)] bg-white py-2 shadow-[0_18px_48px_-16px_oklch(0.22_0.02_80_/_0.35)] animate-fade-in",
        panelVariant === "mobile"
          ? "left-0 right-0 w-full max-w-none"
          : "right-0 w-[min(calc(100vw-2rem),420px)]",
      )}
      role="listbox"
      aria-label={tr(locale, "Søkeforslag", "Search suggestions")}
    >
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-3 text-[13px] text-[var(--color-muted)]">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          {tr(locale, "Søker …", "Searching …")}
        </div>
      ) : null}

      {error ? <p className="px-4 py-3 text-[13px] text-red-800">{error}</p> : null}

      {categoryHits.length > 0 ? (
        <div>
          <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {tr(locale, "Kategorier", "Categories")}
          </p>
          <ul>
            {categoryHits.map((row, i) => {
              const globalIdx = i;
              return (
                <li key={`cat-${row.slug}`} role="none">
                  <Link
                    href={catListingHref(row.slug)}
                    role="option"
                    aria-selected={activeIndex === globalIdx}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                    onClick={onPick}
                    className={cn(
                      "flex items-start gap-3 px-4 py-2.5 text-left text-[13px] transition-colors",
                      activeIndex === globalIdx
                        ? "bg-[var(--color-stone)]/90 text-[var(--color-ink)]"
                        : "text-[var(--color-ink)] hover:bg-[var(--color-stone)]/50",
                    )}
                  >
                    <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-copper)]" aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-medium leading-snug">{row.label}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--color-muted)]">{row.path}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {productHits.length > 0 ? (
        <div className={cn(categoryHits.length > 0 && "border-t border-[var(--color-divider)] pt-2")}>
          <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {tr(locale, "Produkter", "Products")}
          </p>
          <ul>
            {productHits.map((row, i) => {
              const idx = categoryHits.length + i;
              const img = row.productAsset?.preview ? absoluteAssetUrl(row.productAsset.preview) : null;
              return (
                <li key={`prod-${row.productId}-${row.slug}`} role="none">
                  <Link
                    href={productHref(row.slug)}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={onPick}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors",
                      activeIndex === idx
                        ? "bg-[var(--color-stone)]/90 text-[var(--color-ink)]"
                        : "text-[var(--color-ink)] hover:bg-[var(--color-stone)]/50",
                    )}
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[2px] bg-[oklch(0.94_0.005_80)]">
                      {img ? (
                        <Image src={img} alt="" width={44} height={44} className="object-cover" unoptimized />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[var(--color-muted)]">
                          <Package className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{row.productName}</span>
                      <span className="mt-0.5 block text-[11px] font-mono text-[var(--color-copper)] tabular-nums">
                        {formatHitPrice(row)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {noResults ? (
        <p className="px-4 py-6 text-center text-[13px] text-[var(--color-muted)]">
          {tr(locale, "Ingen treff.", "No matches.")}
        </p>
      ) : null}
    </div>
  );
}

function useCombinedRowCount(search: StorefrontSearchApi) {
  return search.categoryHits.length + search.productHits.length;
}

export function NavSearchDesktop({ locale, search }: { locale: Locale; search: StorefrontSearchApi }) {
  const router = useRouter();
  const [barOpen, setBarOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const totalRows = useCombinedRowCount(search);

  const closeAll = useCallback(() => {
    setBarOpen(false);
    setActiveIndex(-1);
    search.clearQuery();
  }, [search]);

  useEffect(() => {
    if (!barOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setBarOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [barOpen]);

  useEffect(() => {
    if (barOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [barOpen]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [search.query, search.categoryHits, search.productHits]);

  const navigateActive = useCallback(() => {
    const { categoryHits: cats, productHits: prods } = search;
    if (activeIndex < 0) return;
    if (activeIndex < cats.length) {
      const row = cats[activeIndex];
      if (row) {
        router.push(catListingHref(row.slug));
        closeAll();
      }
      return;
    }
    const p = prods[activeIndex - cats.length];
    if (p) {
      router.push(productHref(p.slug));
      closeAll();
    }
  }, [activeIndex, search, router, closeAll]);

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeAll();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalRows === 0) return;
      setActiveIndex((i) => (i < 0 ? 0 : Math.min(i + 1, totalRows - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalRows === 0) return;
      setActiveIndex((i) => (i <= 0 ? -1 : i - 1));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0 && totalRows > 0) {
      e.preventDefault();
      navigateActive();
    }
  };

  const q = search.query.trim();
  const showDropdown = barOpen && (q.length >= 1 || search.loading);

  return (
    <div ref={wrapRef} className="relative hidden sm:block">
      <div className="flex items-center justify-end gap-0">
        <div
          className={cn(
            "overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            barOpen ? "max-w-[min(100vw,380px)] opacity-100" : "max-w-0 opacity-0 pointer-events-none",
          )}
        >
          <label className="sr-only" htmlFor={listId}>
            {tr(locale, "Søk i produkter og kategorier", "Search products and categories")}
          </label>
          <div className="flex h-9 min-w-[260px] items-center gap-2 rounded-[2px] border border-[var(--color-divider)] bg-white px-3 shadow-sm sm:min-w-[280px] md:min-w-[300px]">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
            <input
              ref={inputRef}
              id={listId}
              type="search"
              autoComplete="off"
              enterKeyHint="search"
              placeholder={tr(locale, "Søk produkter …", "Search products …")}
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
              role="combobox"
              aria-expanded={showDropdown}
              aria-autocomplete="list"
            />
            {search.query ? (
              <button
                type="button"
                className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                aria-label={tr(locale, "Tøm søk", "Clear search")}
                onClick={() => {
                  search.clearQuery();
                  setActiveIndex(-1);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          aria-label={
            barOpen ? tr(locale, "Lukk søk", "Close search") : tr(locale, "Åpne søk", "Open search")
          }
          aria-expanded={barOpen}
          onClick={() => {
            setBarOpen((v) => {
              if (v) {
                search.clearQuery();
                setActiveIndex(-1);
              }
              return !v;
            });
          }}
          className="shrink-0 p-2 text-[var(--color-ink)] transition-colors hover:text-[var(--color-copper)]"
        >
          {barOpen ? <X className="h-[18px] w-[18px]" strokeWidth={1.5} /> : <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />}
        </button>
      </div>

      {showDropdown ? (
        <SuggestionRows
          locale={locale}
          search={search}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          panelVariant="desktop"
          onPick={() => {
            setBarOpen(false);
            search.clearQuery();
          }}
        />
      ) : null}
    </div>
  );
}

export function NavSearchMobile({
  locale,
  search,
  onResultPick,
}: {
  locale: Locale;
  search: StorefrontSearchApi;
  /** e.g. close the hamburger drawer */
  onResultPick?: () => void;
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const totalRows = useCombinedRowCount(search);

  const closePick = useCallback(() => {
    search.clearQuery();
    setActiveIndex(-1);
    onResultPick?.();
  }, [search, onResultPick]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [search.query, search.categoryHits, search.productHits]);

  const navigateActive = useCallback(() => {
    const { categoryHits: cats, productHits: prods } = search;
    if (activeIndex < 0) return;
    if (activeIndex < cats.length) {
      const row = cats[activeIndex];
      if (row) {
        router.push(catListingHref(row.slug));
        closePick();
      }
      return;
    }
    const p = prods[activeIndex - cats.length];
    if (p) {
      router.push(productHref(p.slug));
      closePick();
    }
  }, [activeIndex, search, router, closePick]);

  const q = search.query.trim();
  const showDropdown = q.length >= 1 || search.loading;

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      search.clearQuery();
      setActiveIndex(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalRows === 0) return;
      setActiveIndex((i) => (i < 0 ? 0 : Math.min(i + 1, totalRows - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalRows === 0) return;
      setActiveIndex((i) => (i <= 0 ? -1 : i - 1));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0 && totalRows > 0) {
      e.preventDefault();
      navigateActive();
    }
  };

  return (
    <div className="relative border-b border-[var(--color-divider)] px-0 pb-4">
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {tr(locale, "Søk", "Search")}
      </label>
      <div className="flex h-10 w-full items-center gap-2 rounded-[2px] border border-[var(--color-divider)] bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
        <input
          id={listId}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={tr(locale, "Produkter og kategorier …", "Products and categories …")}
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        {search.query ? (
          <button
            type="button"
            className="shrink-0 text-[var(--color-muted)]"
            aria-label={tr(locale, "Tøm søk", "Clear search")}
            onClick={() => {
              search.clearQuery();
              setActiveIndex(-1);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <SuggestionRows
          locale={locale}
          search={search}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          panelVariant="mobile"
          onPick={closePick}
        />
      ) : null}
    </div>
  );
}
