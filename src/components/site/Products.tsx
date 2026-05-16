"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import type { ProductsSectionPayload, CatalogProductCard } from "@/lib/vendure/catalog-types";
import { formatShopBannerError } from "@/lib/vendure/shop-banner-error";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

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
        alt={`${product.name} — ${product.brand}`}
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
      alt={`${product.name} — ${product.brand}`}
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

export function Products({
  withCategorySidebar = false,
  locale = "nb",
  catalog,
  initialCatSlug = null,
}: ProductsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

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

  useEffect(() => {
    setActiveSlug(syncSlugAllowed(initialCatSlug, catalog.filterSlugs));
  }, [initialCatSlug, catalog.filterSlugs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("cat");
    if (!fromUrl) return;
    setActiveSlug(syncSlugAllowed(fromUrl, catalog.filterSlugs));
  }, [catalog.filterSlugs]);

  const navigateTab = useCallback(
    (slug: string | null) => {
      const next = syncSlugAllowed(slug, catalog.filterSlugs);
      setActiveSlug(next);
      const path = pathname || "/";
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

  const apiMsg = catalog.error ? formatShopBannerError(catalog.error) : null;

  const filterButtons = pairs.map(({ label, slug }) => (
    <button
      key={label + String(slug)}
      type="button"
      onClick={() => navigateTab(slug)}
      className={cn(
        withCategorySidebar
          ? "w-full text-left px-3 py-2.5 rounded-[3px] text-[13px] font-medium transition-colors border border-transparent"
          : "px-4 py-2.5 text-[13px] font-medium transition-all duration-200 -mb-px border-b-2",
        (slug === null ? activeSlug === null : slug === activeSlug)
          ? withCategorySidebar
            ? "bg-white text-[var(--color-ink)] shadow-sm border-y border-r border-[var(--color-divider)] border-l-[3px] border-l-[var(--color-copper)]"
            : "text-[var(--color-ink)] border-[var(--color-copper)]"
          : withCategorySidebar
            ? "text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-ink)]"
            : "text-[var(--color-muted)] border-transparent hover:text-[var(--color-ink)]",
      )}
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
  ));

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
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  {tr(locale, "Kategori", "Category")}
                </p>
                <div className="flex flex-col gap-0.5">{filterButtons}</div>
              </nav>
            </aside>
          )}

          <div className="min-w-0 flex-1">
            {!withCategorySidebar && (
              <Reveal delay={0.08}>
                <div className="mb-8 flex flex-wrap gap-1.5 border-b border-[var(--color-divider)] pb-0">
                  {filterButtons}
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
              <div
                className={cn(
                  "grid grid-cols-2 gap-3 lg:gap-5",
                  withCategorySidebar ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-4",
                )}
              >
                {visible.map((p, i) => (
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
                        {p.spec ? (
                          <p className="mt-2 text-[12px] text-[var(--color-muted)] leading-relaxed font-mono">
                            {p.spec}
                          </p>
                        ) : null}
                        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-[var(--color-divider)]">
                          <div className="hidden md:block">
                            <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-[0.12em]">
                              {tr(locale, "Fra", "From")}
                            </p>
                            <p className="text-[15px] font-bold text-[var(--color-copper)] tracking-[-0.01em] leading-tight">
                              {p.price}
                            </p>
                          </div>
                          <span className="text-[12px] font-medium text-[var(--color-ink)] inline-flex items-center gap-1 group-hover:text-[var(--color-copper)] transition-colors">
                            {tr(locale, "Se produkt", "View product")}
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
