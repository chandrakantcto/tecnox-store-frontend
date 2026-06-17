"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "./Reveal";
import type { ProductsSectionPayload, CatalogProductCard, SidebarTreeNode } from "@/lib/vendure/catalog-types";
import { formatShopBannerError } from "@/lib/vendure/shop-banner-error";
import { formatNOKExclVatCardAmount } from "@/lib/vendure/normalize";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { displayBrandName } from "@/lib/brand";
import { resolveCollectionDisplayNames } from "@/data/collectionLabels";
import { BsArrowUpRightCircleFill } from "react-icons/bs";
import { ImageUnavailablePlaceholder } from "@/components/site/ImageUnavailablePlaceholder";
import { isMissingStorefrontImage } from "@/lib/storefront-image";
import { StorefrontRemoteImage } from "@/components/site/StorefrontRemoteImage";

type ProductsProps = {
  withCategorySidebar?: boolean;
  locale?: Locale;
  catalog: ProductsSectionPayload;
  /** Server-parsed query (?cat=) for /produkter */
  initialCatSlug?: string | null;
  /** Server-parsed query (?q=) for /produkter keyword search */
  initialSearchQuery?: string | null;
};

function productDisplayName(product: CatalogProductCard, locale: Locale): string {
  return tr(locale, product.nameNb ?? product.name, product.nameEn ?? product.name);
}

function stripHtmlMarkup(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function productSpecSnippet(product: CatalogProductCard, locale: Locale): string {
  const raw = tr(
    locale,
    product.descriptionNb?.trim() || product.description?.trim() || product.spec,
    product.descriptionEn?.trim() || product.description?.trim() || product.spec,
  );
  return stripHtmlMarkup(raw);
}

function productPriceDisplay(product: CatalogProductCard, locale: Locale): string {
  const minor = product.priceNumeric > 0 ? product.priceNumeric : null;
  return formatNOKExclVatCardAmount(locale, minor);
}

function subcategoryDisplayName(
  sc: { slug: string; name: string; nameNb?: string; nameEn?: string },
  locale: Locale,
): string {
  const { nb, en } = resolveCollectionDisplayNames(
    sc.slug,
    sc.nameNb ?? sc.name,
    sc.nameEn ?? sc.name,
    sc.name,
  );
  return tr(locale, nb, en);
}

function productImage(product: CatalogProductCard, locale: Locale) {
  const altName = productDisplayName(product, locale);
  const alt = altName.length > 10 ? `${altName.slice(0, 10)}...` : altName;
  const src = typeof product.img === "string" ? product.img : null;

  if (typeof product.img !== "string") {
    return (
      <Image
        src={product.img}
        alt={alt}
        loading="lazy"
        width={1024}
        height={768}
        sizes="(max-width: 1024px) 50vw, 25vw"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
    );
  }

  if (isMissingStorefrontImage(src)) {
    return (
      <ImageUnavailablePlaceholder
        locale={locale}
        className="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
    );
  }

  return (
    <StorefrontRemoteImage
      src={src}
      alt={alt}
      locale={locale}
      className="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
    />
  );
}

function syncSlugAllowed(slug: string | null, allowed: (string | null)[]): string | null {
  // Always keep the slug so we know we are in a subcategory, even if it's not a root tab
  return slug;
}

function indexForSlug(pairs: { slug: string | null }[], slug: string | null): number {
  const idx = pairs.findIndex((p) => (slug === null ? p.slug === null : p.slug === slug));
  return idx >= 0 ? idx : 0;
}

function indexForSidebarHighlight(
  pairs: { slug: string | null }[],
  urlSlug: string | null,
  sidebarRootSlug?: string | null,
): number {
  const highlight = sidebarRootSlug ?? urlSlug;
  return indexForSlug(pairs, highlight);
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
  initialSearchQuery = null,
}: ProductsProps) {
  const locale = useActiveLocale();
  const searchQuery = catalog.searchQuery ?? initialSearchQuery;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const isHomePreview = !withCategorySidebar;
  const homeGridCols = useHomeGridColumns(isHomePreview);
  const [previewRows, setPreviewRows] = useState(HOMEPAGE_INITIAL_ROWS);

  const pairs = useMemo(() => {
    const n = Math.min(catalog.filters.length, catalog.filterSlugs.length);
    return catalog.filters.slice(0, n).map((label, i) => ({
      label: tr(locale, catalog.filtersNb?.[i] ?? label, catalog.filtersEn?.[i] ?? label),
      slug: catalog.filterSlugs[i] ?? null,
    }));
  }, [catalog, locale]);

  const countForFilter = useCallback(
    (slug: string | null) => {
      if (catalog.sidebarTree) {
        if (slug === null) {
          const list = catalog.products ?? [];
          if (list.length > 0) return list.length;
          return catalog.sidebarTree.length;
        }
        const findNode = (nodes: SidebarTreeNode[], s: string): SidebarTreeNode | null => {
          for (const n of nodes) {
            if (n.slug === s) return n;
            if (n.children) {
              const found = findNode(n.children, s);
              if (found) return found;
            }
          }
          return null;
        };
        const node = findNode(catalog.sidebarTree, slug);
        if (node) return node.count;
      }
      const list = catalog.products ?? [];
      if (slug === null) return list.length;
      return list.filter((p) => p.categorySlug === slug).length;
    },
    [catalog.sidebarTree, catalog.products],
  );

  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    syncSlugAllowed(initialCatSlug, catalog.filterSlugs),
  );
  const [activeTabIndex, setActiveTabIndex] = useState(() =>
    indexForSidebarHighlight(
      pairs,
      syncSlugAllowed(initialCatSlug, catalog.filterSlugs),
      catalog.sidebarRootSlug,
    ),
  );
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

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const slug = syncSlugAllowed(initialCatSlug, catalog.filterSlugs);
    setActiveSlug(slug);
    setActiveTabIndex(indexForSidebarHighlight(pairs, slug, catalog.sidebarRootSlug));
    
    // Auto-expand active parent
    if (slug && catalog.sidebarTree) {
      const findPath = (nodes: SidebarTreeNode[], target: string, path: string[] = []): string[] | null => {
        for (const n of nodes) {
          if (n.slug === target) return path;
          if (n.children && n.children.length > 0) {
            const found = findPath(n.children, target, [...path, n.id]);
            if (found) return found;
          }
        }
        return null;
      };
      const path = findPath(catalog.sidebarTree, slug);
      if (path) {
        setExpandedCategories(prev => {
          const newExpanded = new Set(prev);
          path.forEach(id => newExpanded.add(id));
          return Array.from(newExpanded);
        });
      }
    }
  }, [initialCatSlug, catalog.filterSlugs, catalog.sidebarRootSlug, pairs, catalog.sidebarTree]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("cat");
    const slug = fromUrl ? syncSlugAllowed(fromUrl, catalog.filterSlugs) : null;
    setActiveSlug(slug);
    setActiveTabIndex(indexForSidebarHighlight(pairs, slug, catalog.sidebarRootSlug));
  }, [catalog.filterSlugs, catalog.sidebarRootSlug, pairs]);

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
    if (withCategorySidebar) return list; // Server already filtered exactly what we need
    if (activeSlug === null) return list;
    return list.filter((p) => p.categorySlug === activeSlug);
  }, [catalog.products, activeSlug, withCategorySidebar]);

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
        "nav-link shrink-0 whitespace-nowrap px-4 py-2.5 text-[14px] font-medium cursor-pointer",
        !isActive && "text-[var(--color-muted)]",
      )}
      data-active={isActive ? "true" : undefined}
    >
      {label}
    </button>
    );
  });

  const toggleCategory = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const renderSidebarTree = (nodes: SidebarTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedCategories.includes(node.id);
      const isSubActive = activeSlug === node.slug;
      
      if (depth === 0) {
        const isActiveRoot = activeSlug === node.slug || (catalog.sidebarRootSlug === node.slug && activeSlug !== null);
        return (
          <div key={node.id} className="group border-b border-gray-50 last:border-0">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2.5 hover:bg-white/70 transition-colors cursor-pointer",
                isActiveRoot ? "bg-white text-[var(--color-ink)] shadow-sm border-l-[3px] border-l-[var(--color-copper)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              )}
              onClick={() => {
                const idx = indexForSlug(pairs, node.slug);
                navigateTab(node.slug, idx);
                if (window.innerWidth < 1024) setCategoryMenuOpen(false);
              }}
            >
              <span className="text-[13px] font-medium flex-1 min-w-0 truncate">
                {locale === "en" ? node.nameEn || node.name : node.nameNb || node.name}
                <span className="ml-2 tabular-nums text-[11px] text-[var(--color-muted)] font-normal">
                  ({node.count})
                </span>
              </span>

              {node.children && node.children.length > 0 && (
                <div
                  className="p-1 cursor-pointer"
                  onClick={(e) => toggleCategory(e, node.id)}
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      isActiveRoot ? "text-[var(--color-copper)]" : "text-[var(--color-muted)]",
                      !isExpanded && "-rotate-90"
                    )}
                    strokeWidth={2}
                  />
                </div>
              )}
            </div>

            {isExpanded && node.children && node.children.length > 0 && (
              <div className="bg-white/30 py-1">
                {renderSidebarTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer relative",
              isSubActive ? "text-[var(--color-copper)] bg-white/50" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => {
              const idx = indexForSlug(pairs, node.slug);
              navigateTab(node.slug, idx);
              if (window.innerWidth < 1024) setCategoryMenuOpen(false);
            }}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                isSubActive ? "bg-[var(--color-copper)]" : "bg-[var(--color-divider)]"
              )}
            />
            <span className="flex-1 truncate">
              {locale === "en" ? node.nameEn || node.name : node.nameNb || node.name}
            </span>
            <span className="tabular-nums text-[10px] text-[var(--color-muted)] font-normal bg-white/50 pr-4 rounded-[2px]">
              {node.count}
            </span>

            {node.children && node.children.length > 0 && (
              <div
                className="p-1 cursor-pointer absolute right-2"
                onClick={(e) => toggleCategory(e, node.id)}
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform text-[var(--color-muted)]",
                    !isExpanded && "-rotate-90"
                  )}
                  strokeWidth={2}
                />
              </div>
            )}
          </div>
          {isExpanded && node.children && node.children.length > 0 && (
            <div className="bg-white/10 border-l border-[var(--color-divider)] ml-4">
              {renderSidebarTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

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
                  className="flex w-full items-center justify-between   cursor-pointer gap-3 px-3 py-3 text-left lg:hidden"
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
                  <div className="group border-b border-gray-50 last:border-0">
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/70 transition-colors cursor-pointer text-left",
                        activeSlug === null ? "bg-white text-[var(--color-ink)] shadow-sm border-l-[3px] border-l-[var(--color-copper)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                      )}
                      onClick={() => {
                        navigateTab(null, 0);
                        if (window.innerWidth < 1024) setCategoryMenuOpen(false);
                      }}
                    >
                      <span className="text-[13px] font-medium flex-1 min-w-0 truncate">
                        {locale === "en" ? "All" : "Alle"}
                        <span className="ml-2 tabular-nums text-[11px] text-[var(--color-muted)] font-normal">
                          ({countForFilter(null)})
                        </span>
                      </span>
                    </button>
                  </div>
                  {catalog.sidebarTree ? renderSidebarTree(catalog.sidebarTree) : filterButtons}
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

            {!isHomePreview && catalog.subcategories && catalog.subcategories.length > 0 && (
              <div className="mb-10">
                <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-[var(--color-muted)] mb-4">
                  {tr(locale, "Underkategorier", "Subcategories")}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {catalog.subcategories.map((sc, i) => (
                    <Reveal key={sc.slug} delay={Math.min(i * 0.05, 0.3)}>
                      <Link
                        href={`/produkter?cat=${encodeURIComponent(sc.slug)}`}
                        onClick={() => router.refresh()}
                        className="group flex flex-col bg-white border border-[var(--color-divider)] rounded-[3px] overflow-hidden hover:border-[var(--color-copper)] hover:shadow-sm transition-all h-full"
                      >
                        <div className="aspect-[4/3] bg-[oklch(0.96_0.005_80)] relative">
                          {sc.remoteImageSrc ? (
                            <Image
                              src={sc.remoteImageSrc}
                              alt={subcategoryDisplayName(sc, locale)}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-30">
                              <ImageUnavailablePlaceholder locale={locale} />
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-[13px] font-bold text-[var(--color-ink)] group-hover:text-[var(--color-copper)] transition-colors truncate pr-2">
                            {subcategoryDisplayName(sc, locale)}
                          </span>
                          <span className="text-[11px] text-[var(--color-muted)] tabular-nums bg-[oklch(0.96_0.005_80)] px-1.5 py-0.5 rounded-[2px]">
                            {sc.count}
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}

            {searchQuery ? (
              <Reveal>
                <p className="mb-6 text-[15px] text-[var(--color-ink)]">
                  {tr(locale, "Søkeresultater for", "Results for")}{" "}
                  <span className="font-semibold text-[var(--color-copper)]">&laquo;{searchQuery}&raquo;</span>
                  {visible.length > 0 ? (
                    <span className="text-[var(--color-muted)]">
                      {" "}
                      ({visible.length} {tr(locale, "treff", "matches")})
                    </span>
                  ) : null}
                </p>
              </Reveal>
            ) : null}

            {visible.length === 0 ? (
              <p className="text-[15px] text-[var(--color-muted)]">
                {searchQuery
                  ? tr(
                      locale,
                      `Ingen produkter funnet for «${searchQuery}».`,
                      `No products found for «${searchQuery}».`,
                    )
                  : tr(
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
                {gridProducts.map((p, i) => {
                  const specSnippet = productSpecSnippet(p, locale);
                  return (
                  <Reveal key={p.slug} delay={Math.min(i * 0.05, 0.3)}>
                    <Link
                      href={`/produkter/${p.slug}`}
                      className="group card-elevated flex flex-col h-full cursor-pointer"
                    >
                      <div className="relative overflow-hidden">
                        <div className="aspect-[4/3] bg-[oklch(0.94_0.005_80)] overflow-hidden">
                          {productImage(p, locale)}
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
                          {displayBrandName(p.brand)}
                        </p>
                        <h3 className="mt-1.5 text-[15px] font-bold text-[var(--color-ink)] leading-snug tracking-[-0.015em] group-hover:text-[var(--color-copper)] transition-colors">
                          {productDisplayName(p, locale)}
                        </h3>
                        {specSnippet.length > 30 ? (
                          <p className="mt-2 text-[12px] text-[var(--color-muted)] leading-relaxed font-mono">
                            {specSnippet.slice(0, 30) + "..."}
                          </p>
                        ) : null}
                        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-[var(--color-divider)]">
                          <div >
                          {/*   <p className="text-[12px] text-[var(--color-muted)] uppercase tracking-[0.12em]">
                              {tr(locale, "Fra", "From")}
                            </p> */}
                            <p className="text-[12px] font-bold text-[var(--color-copper)] tracking-[-0.01em] leading-tight">
                              {productPriceDisplay(p, locale)}
                            </p>
                          </div>
                          <span className="text-[5px] font-medium text-[var(--color-ink)] inline-flex items-center gap-1 group-hover:text-[var(--color-copper)] transition-colors">
                             < BsArrowUpRightCircleFill   className="text-[16px] text-[var(--color-muted)] group-hover:text-[var(--color-copper)] transition-colors"/>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                  );
                })}
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
