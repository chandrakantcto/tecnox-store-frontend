"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { getLocalizedFilters, getLocalizedProducts } from "@/lib/products";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

type ProductsProps = {
  /** Full catalog layout with sticky category sidebar (Produkter page) */
  withCategorySidebar?: boolean;
  locale?: Locale;
};

export function Products({ withCategorySidebar = false, locale = "nb" }: ProductsProps) {
  const filters = getLocalizedFilters(locale);
  const products = getLocalizedProducts(locale);
  const allLabel = filters[0] ?? "All";
  const [active, setActive] = useState(allLabel);

  useEffect(() => {
    setActive(allLabel);
  }, [allLabel]);

  const visible =
    active === allLabel ? products : products.filter((p) => p.category === active);

  const filterButtons = filters.map((f) => (
    <button
      key={f}
      type="button"
      onClick={() => setActive(f)}
      className={cn(
        withCategorySidebar
          ? "w-full text-left px-3 py-2.5 rounded-[3px] text-[13px] font-medium transition-colors border border-transparent"
          : "px-4 py-2.5 text-[13px] font-medium transition-all duration-200 -mb-px border-b-2",
        active === f
          ? withCategorySidebar
            ? "bg-white text-[var(--color-ink)] shadow-sm border-y border-r border-[var(--color-divider)] border-l-[3px] border-l-[var(--color-copper)]"
            : "text-[var(--color-ink)] border-[var(--color-copper)]"
          : withCategorySidebar
            ? "text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-ink)]"
            : "text-[var(--color-muted)] border-transparent hover:text-[var(--color-ink)]",
      )}
    >
      {f}
      {withCategorySidebar && f !== allLabel && (
        <span className="ml-2 tabular-nums text-[11px] text-[var(--color-muted)] font-normal">
          ({products.filter((p) => p.category === f).length})
        </span>
      )}
      {withCategorySidebar && f === allLabel && (
        <span className="ml-2 tabular-nums text-[11px] text-[var(--color-muted)] font-normal">
          ({products.length})
        </span>
      )}
    </button>
  ));

  return (
    <section className="bg-[var(--color-stone)] section-pad pt-16 lg:pt-20">
      <div className="container-x">
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

            {/* Product grid */}
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
                        <Image
                          src={p.img}
                          alt={`${p.name} — ${p.brand}`}
                          loading="lazy"
                          width={1024}
                          height={768}
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        />
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
                      <p className="mt-2 text-[12px] text-[var(--color-muted)] leading-relaxed font-mono">
                        {p.spec}
                      </p>
                      <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-[var(--color-divider)]">
                        <div>
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
          </div>
        </div>
      </div>
    </section>
  );
}
