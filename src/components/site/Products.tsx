"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "./Reveal";
import type { ProductsSectionPayload, CatalogProductCard } from "@/lib/vendure/catalog-types";
import { formatShopBannerError } from "@/lib/vendure/shop-banner-error";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { BsArrowUpRightCircleFill } from "react-icons/bs";

type ProductsProps = {
  withCategorySidebar?: boolean;
  locale?: Locale;
  catalog: ProductsSectionPayload;
  /** Server-parsed query (?cat=) for /produkter */
  initialCatSlug?: string | null;
};

function productImage(product: CatalogProductCard) {
  if (typeof product.img === "string") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.img}
        alt={
  product.name.length > 10
    ? product.name.slice(0, 10) + "..."
    : product.name
}
        loading="lazy"
        width={1024}
        height={768}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
    );
  }
  return (
    <Image
      src={product.img}
     alt={
  product.name.length > 10
    ? product.name.slice(0, 10) + "..."
    : product.name
}
      loading="lazy"
      width={1024}
      height={768}
      sizes="(max-width: 1024px) 50vw, 25vw"
      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
    />
  );
}

function syncSlugAllowed(slug: string | null, allowed: (string | null)[]): string | null {
  if (slug !== null && !allowed.includes(slug)) return null;
  return slug;
}

function indexForSlug(pairs: { slug: string | null }[], slug: string | null): number {
  const idx = pairs.findIndex((p) => (slug === null ? p.slug === null : p.slug === slug));
  return idx >= 0 ? idx : 0;
}

const HOMEPAGE_INITIAL_ROWS = 3;

function useHomeGridColumns(enabled: boolean) {
  const [cols, setCols] = useState(4);

  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) setCols(2);
      else if (w < 1024) setCols(3);
      else setCols(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [enabled]);

  return cols;
}

export function Products({
  withCategorySidebar = false,
  locale: _locale,
  catalog,
  initialCatSlug = null,
}: ProductsProps) {
  const locale = useActiveLocale();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const isHomePreview = !withCategorySidebar;
  const homeGridCols = useHomeGridColumns(isHomePreview);
  const [previewRows, setPreviewRows] = useState(HOMEPAGE_INITIAL_ROWS);

  const pairs = useMemo(() => {
    const n = Math.min(catalog.filters.length, catalog.filterSlugs.length);
    return catalog.filters.slice(0, n).map((label, i) => ({
      label,
      slug: catalog.filterSlugs[i] ?? null,
    }));
  }, [catalog]);

  const countForFilter = useCallback(
    (slug: string | null) => {
      const sc = catalog.filterSidebarCounts;
      if (sc) {
        if (slug === null) return sc.all;
        return sc.bySlug[slug] ?? 0;
      }
      const list = catalog.products ?? [];
      if (slug === null) return list.length;
      return list.filter((p) => p.categorySlug === slug).length;
    },
    [catalog.filterSidebarCounts, catalog.products],
  );

  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    syncSlugAllowed(initialCatSlug, catalog.filterSlugs),
  );
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [tabScrollHints, setTabScrollHints] = useState({ left: false, right: false, overflow: false });

  const updateTabScrollHints = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 2;
    setTabScrollHints({
      overflow,
      left: overflow && el.scrollLeft > 2,
      right: overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const slug = syncSlugAllowed(initialCatSlug, catalog.filterSlugs);
    setActiveSlug(slug);
    setActiveTabIndex(indexForSlug(pairs, slug));
  }, [initialCatSlug, catalog.filterSlugs, pairs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("cat");
    if (!fromUrl) return;
    const slug = syncSlugAllowed(fromUrl, catalog.filterSlugs);
    setActiveSlug(slug);
    setActiveTabIndex(indexForSlug(pairs, slug));
  }, [catalog.filterSlugs, pairs]);

  useEffect(() => {
    setPreviewRows(HOMEPAGE_INITIAL_ROWS);
  }, [activeSlug, activeTabIndex]);

  useEffect(() => {
    updateTabScrollHints();
    const el = tabScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateTabScrollHints, { passive: true });
    const ro = new ResizeObserver(updateTabScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateTabScrollHints);
      ro.disconnect();
    };
  }, [pairs, updateTabScrollHints]);

  const scrollTabs = useCallback((direction: "left" | "right") => {
    const el = tabScrollRef.current;
    if (!el) return;
    const delta = Math.max(el.clientWidth * 0.75, 200);
    el.scrollBy({ left: direction === "left" ? -delta : delta, behavior: "smooth" });
  }, []);

  const navigateTab = useCallback(
    (slug: string | null, tabIndex: number) => {
      const next = syncSlugAllowed(slug, catalog.filterSlugs);
      setActiveSlug(next);
      setActiveTabIndex(tabIndex);
      const path = pathname || "/";

      // Homepage filters client-side; avoid router refresh that re-streams SiteHeader/MainNav.
      if (path === "/") {
        const url = next ? `${path}?cat=${encodeURIComponent(next)}` : path;
        window.history.replaceState(window.history.state, "", url);
        return;
      }

      if (next) {
        router.replace(`${path}?cat=${encodeURIComponent(next)}`, { scroll: false });
      } else {
        router.replace(path, { scroll: false });
      }
      router.refresh();
    },
    [pathname, router, catalog.filterSlugs],
  );

  const visible = useMemo(() => {
    const list = catalog.products ?? [];
    if (activeSlug === null) return list;
    return list.filter((p) => p.categorySlug === activeSlug);
  }, [catalog.products, activeSlug]);

  const homePreviewLimit = previewRows * homeGridCols;
  const gridProducts = isHomePreview ? visible.slice(0, homePreviewLimit) : visible;
  const canViewMore = isHomePreview && visible.length > homePreviewLimit;
  const viewAllHref = activeSlug ? `/produkter?cat=${encodeURIComponent(activeSlug)}` : "/produkter";

  const apiMsg = catalog.error ? formatShopBannerError(catalog.error) : null;

  const activeFilterLabel = useMemo(() => {
    const match = pairs[activeTabIndex] ?? pairs.find((p) => (p.slug === null ? activeSlug === null : p.slug === activeSlug));
    if (!match) return tr(locale, "Kategori", "Category");
    return `${match.label} (${countForFilter(match.slug)})`;
  }, [pairs, activeTabIndex, activeSlug, countForFilter, locale]);

  const filterButtons = pairs.map(({ label, slug }, index) => {
    const isActive = index === activeTabIndex;

    return (
    <button
      key={`${index}-${label}-${String(slug)}`}
      type="button"
      onClick={() => {
        navigateTab(slug, index);
        if (withCategorySidebar) setCategoryMenuOpen(false);
      }}
      className={cn(
        withCategorySidebar
          ? "w-full text-left px-3 py-2.5 rounded-[3px] text-[13px] font-medium transition-colors border border-transparent"
          : "nav-link shrink-0 whitespace-nowrap px-4 py-2.5 text-[14px] font-medium cursor-pointer",
        !withCategorySidebar && !isActive && "text-[var(--color-muted)]",
        isActive &&
          withCategorySidebar &&
          "bg-white text-[var(--color-ink)] shadow-sm border-y border-r border-[var(--color-divider)] border-l-[3px] border-l-[var(--color-copper)]",
        !isActive &&
          withCategorySidebar &&
          "text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-ink)]",
      )}
      data-active={!withCategorySidebar && isActive ? "true" : undefined}
    >
      {label}
      {withCategorySidebar && slug !== null && (
        <span className="ml-2 tabular-nums text-[11px] text-[var(--color-muted)] font-normal">
          ({countForFilter(slug)})
        </span>
      )}
      {withCategorySidebar && slug === null && (
        <span className="ml-2 tabular-nums text-[11px] text-[var(--color-muted)] font-normal">
          ({countForFilter(null)})
        </span>
      )}
    </button>
    );
  });

  return (
    <section className="bg-[var(--color-stone)] section-pad pt-16 lg:pt-20">
      <div className="container-x">
        {apiMsg ? (
          <p className="mb-8 rounded-[3px] border border-amber-800/40 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            {apiMsg}
          </p>
        ) : null}
        <div
          className={cn(
            "flex flex-col gap-8",
            withCategorySidebar && "lg:flex-row lg:items-start lg:gap-10",
          )}
        >
          {withCategorySidebar && (
            <aside className="shrink-0 lg:w-60 lg:sticky lg:top-28 lg:self-start">
              <nav
                aria-label={tr(locale, "Produktkategorier", "Product categories")}
                className="rounded-[3px] border border-[var(--color-divider)] bg-[oklch(0.98_0.005_80)] p-1"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left lg:hidden"
                  onClick={() => setCategoryMenuOpen((v) => !v)}
                  aria-expanded={categoryMenuOpen}
                >
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {tr(locale, "Kategori", "Category")}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-[var(--color-ink)]">{activeFilterLabel}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform",
                        categoryMenuOpen && "rotate-180",
                      )}
                      strokeWidth={2}
                    />
                  </span>
                </button>

                <p className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] lg:block">
                  {tr(locale, "Kategori", "Category")}
                </p>

                <div
                  className={cn(
                    "flex flex-col gap-0.5",
                    categoryMenuOpen ? "block" : "hidden",
                    "lg:block",
                  )}
                >
                  {filterButtons}
                </div>
              </nav>
            </aside>
          )}

          <div className="min-w-0 flex-1">
            {!withCategorySidebar && (
              <Reveal delay={0.08}>
                <div className="mb-8 flex items-center gap-2 border-b border-[var(--color-divider)] pb-2">
                  {tabScrollHints.overflow ? (
                    <button
                      type="button"
                      aria-label={tr(locale, "Scroll kategorier til venstre", "Scroll categories left")}
                      onClick={() => scrollTabs("left")}
                      disabled={!tabScrollHints.left}
                      className="mb-2 shrink-0 flex h-8 w-8 items-center justify-center rounded-[3px] border border-[var(--color-divider)] bg-white text-[var(--color-muted)] transition-colors hover:border-[var(--color-copper)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    </button>
                  ) : null}
                  <div
                    ref={tabScrollRef}
                    className="mb-0 min-w-0 flex flex-1 flex-nowrap gap-1.5 overflow-x-auto pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {filterButtons}
                  </div>
                  {tabScrollHints.overflow ? (
                    <button
                      type="button"
                      aria-label={tr(locale, "Scroll kategorier til høyre", "Scroll categories right")}
                      onClick={() => scrollTabs("right")}
                      disabled={!tabScrollHints.right}
                      className="mb-2 shrink-0 flex h-8 w-8 items-center justify-center rounded-[3px] border border-[var(--color-divider)] bg-white text-[var(--color-muted)] transition-colors hover:border-[var(--color-copper)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
              </Reveal>
            )}

            {visible.length === 0 ? (
              <p className="text-[15px] text-[var(--color-muted)]">
                {tr(
                  locale,
                  "Ingen produkter å vise.",
                  "No products to show.",
                )}
              </p>
            ) : (
              <>
              <div
                className={cn(
                  "grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-5",
                  withCategorySidebar ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-4",
                )}
              >
                {gridProducts.map((p, i) => (
                  <Reveal key={p.slug} delay={Math.min(i * 0.05, 0.3)}>
                    <Link
                      href={`/produkter/${p.slug}`}
                      className="group card-elevated flex flex-col h-full cursor-pointer"
                    >
                      <div className="relative overflow-hidden">
                        <div className="aspect-[4/3] bg-[oklch(0.94_0.005_80)] overflow-hidden">
                          {productImage(p)}
                        </div>
                        {p.badge && (
                          <span className="absolute top-3 left-3 bg-[var(--color-copper)] text-white text-[10px] font-bold tracking-[0.14em] px-2 py-1 rounded-[2px] shadow-sm">
                            {p.badge}
                          </span>
                        )}
                        <span className="absolute top-3 right-3 text-[10px] font-mono text-[var(--color-muted)] bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-[2px] tracking-[0.1em]">
                          /{String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-[0.14em] font-semibold">
                          {p.brand}
                        </p>
                        <h3 className="mt-1.5 text-[15px] font-bold text-[var(--color-ink)] leading-snug tracking-[-0.015em] group-hover:text-[var(--color-copper)] transition-colors">
                          {p.name}
                        </h3>
                        {p.spec && p.spec.length > 30 ? (
                          <p className="mt-2 text-[12px] text-[var(--color-muted)] leading-relaxed font-mono">
                            {p.spec.slice(0, 30) + "..."}
                          </p>
                        ) : null}
                        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-[var(--color-divider)]">
                          <div >
                            <p className="text-[12px] text-[var(--color-muted)] uppercase tracking-[0.12em]">
                              {tr(locale, "Fra", "From")}
                            </p>
                            <p className="text-[12px] font-bold text-[var(--color-copper)] tracking-[-0.01em] leading-tight">
                              {p.price}
                            </p>
                          </div>
                          <span className="text-[5px] font-medium text-[var(--color-ink)] inline-flex items-center gap-1 group-hover:text-[var(--color-copper)] transition-colors">
                             < BsArrowUpRightCircleFill   className="text-[16px] text-[var(--color-muted)] group-hover:text-[var(--color-copper)] transition-colors"/>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
              {isHomePreview ? (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    {canViewMore ? (
                      <button
                        type="button"
                        onClick={() => setPreviewRows((rows) => rows + 1)}
                        className="btn-outline-dark cursor-pointer"
                      >
                        {tr(locale, "Vis mer", "View more")}
                      </button>
                    ) : null}
                  </div>
                  <Link
                    href={viewAllHref}
                    className="btn-primary cursor-pointer"
                  >
                    {tr(locale, "Vis alle", "View all")}
                  </Link>
                </div>
              ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
