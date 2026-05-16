"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import type {
  HomepageCategoryTile,
  CategoriesSectionCopy,
} from "@/lib/vendure/catalog-types";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { formatShopBannerError } from "@/lib/vendure/shop-banner-error";

export type CategoriesProps = {
  showSeeAllLink?: boolean;
  locale?: Locale;
  tiles?: HomepageCategoryTile[];
  categoriesCopy?: CategoriesSectionCopy | null;
  /** Set when upstream Shop/nav request failed — shown instead of implying missing images only */
  catalogError?: string | null;
};

export function Categories({
  showSeeAllLink = true,
  locale = "nb",
  tiles,
  categoriesCopy = null,
  catalogError = null,
}: CategoriesProps) {
  const cats =
    tiles?.filter(
      (t) =>
        typeof t.slug === "string" &&
        t.slug.length > 0 &&
        typeof t.name === "string" &&
        t.name.length > 0,
    ) ?? [];

  const apiMsg = catalogError ? formatShopBannerError(catalogError) : null;

  const eyebrowLabel =
    categoriesCopy?.eyebrow?.trim() || tr(locale, "Kategorier", "Categories");
  const headline =
    categoriesCopy?.heading?.trim() ||
    tr(locale, "Finn riktig utstyr — raskt.", "Find the right equipment fast.");
  const supportingParagraph =
    categoriesCopy?.supportingText?.trim() ||
    tr(
      locale,
      "Klikk en kategori for å se alle produkter, merker og spesifikasjoner.",
      "Click a category to view all products, brands, and specifications.",
    );
  const emptyListMessageConfigured =
    categoriesCopy?.emptyMessage?.trim() ||
    tr(
      locale,
      "Ingen rotkategori ble returnert eller listen er tom. Opprett øverstenivå–samlinger i Vendure –admin og del dem med kanalen.",
      "No category roots were returned. Create top‑level collections in Vendure Admin and assign them to this channel.",
    );
  const emptyListTechnicalHint =
    tr(
      locale,
      "Klarte ikke å hente kategoridata. Sjekk Shop API‑nettadresse og kanal‑token (.env.local) og at serveren kjører.",
      "Could not load category data from the Shop API. Verify the Shop API URL and channel token (.env.local) and that Vendure is running.",
    );
  const seeAllLabel =
    categoriesCopy?.seeAllLinkLabel?.trim() ||
    tr(locale, "Se alle kategorier", "See all categories");
  return (
    <section className="bg-white section-pad border-b border-[var(--color-divider)]">
      <div className="container-x">
        <Reveal>
          <div className="mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-xl">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {eyebrowLabel}
              </span>
              <h2 className="display-h2 mt-4 text-[var(--color-ink)]">{headline}</h2>
            </div>
            <p className="max-w-md text-[15px] leading-[1.65] text-[var(--color-muted)] lg:text-right">{supportingParagraph}</p>
          </div>
        </Reveal>

        {cats.length === 0 ? (
          <Reveal>
            <p
              className={`rounded-[3px] px-4 py-10 text-center text-[15px] whitespace-pre-line ${
                apiMsg
                  ? "border border-amber-800/40 bg-amber-50 text-amber-950"
                  : "border border-[var(--color-divider)] bg-[var(--color-stone)]/40 text-[var(--color-muted)]"
              }`}
            >
              {apiMsg ? `${emptyListTechnicalHint}\n\n${apiMsg}` : emptyListMessageConfigured}
            </p>
          </Reveal>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            {cats.map((cat, i) => (
              <Reveal key={cat.slug} delay={Math.min(i * 0.04, 0.32)}>
                <Link
                  href={cat.href}
                  className="group block bg-white relative overflow-hidden rounded-[3px] border border-[var(--color-divider)] hover:border-[var(--color-copper)] hover:shadow-[0_16px_32px_-12px_oklch(0.18_0.005_60/0.18)] transition-all duration-300 h-full"
                >
                  <div className="aspect-[3/4] flex flex-col">
                    <div className="flex-[7] relative overflow-hidden bg-[oklch(0.93_0.005_80)]">
                      {cat.remoteImageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cat.remoteImageSrc}
                          alt={cat.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                          width={768}
                          height={1024}
                        />
                      ) : (
                        <div className="flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-2 border-b border-[var(--color-divider)]/40 px-4 text-center">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            {cat.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[10px] leading-snug text-[var(--color-muted)]/85">
                            {tr(locale, "Bilde kommer snart", "Image coming soon")}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.005_60/0.5)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="absolute top-2.5 left-2.5 text-[10px] font-mono text-white/95 tracking-[0.1em] z-10 bg-[oklch(0.18_0.005_60/0.55)] backdrop-blur-sm px-1.5 py-0.5 rounded-[2px]">
                        /{String(i + 1).padStart(2, "0")}
                      </div>
                      <ArrowUpRight
                        className="absolute top-2.5 right-2.5 h-5 w-5 text-white opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all pointer-events-none"
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-[3] flex flex-col justify-center px-3.5 py-3 bg-white border-t border-[var(--color-divider)]">
                      <h3 className="text-[13px] lg:text-[15px] font-bold text-[var(--color-ink)] leading-tight tracking-[-0.015em] group-hover:text-[var(--color-copper)] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-[11px] text-[var(--color-muted)] tracking-[0.02em]">
                        <span className="text-[var(--color-copper)] font-semibold">{cat.count}</span>{" "}
                        {tr(locale, "produkter", "products")}
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {showSeeAllLink && (
          <div className="mt-10 flex justify-end">
            <Link
              href="/kategorier"
              className="group inline-flex items-center gap-1.5 text-[var(--color-copper)] text-[14px] font-medium hover:gap-2.5 transition-all"
            >
              {seeAllLabel}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
