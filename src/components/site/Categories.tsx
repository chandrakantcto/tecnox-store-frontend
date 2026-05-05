"use client";

import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MEGA_MENU_TREE } from "@/data/megaMenu";
import catKokStek from "@/assets/cat-kok-stek.jpg";
import catKjoling from "@/assets/cat-kjoling.jpg";
import catOppvask from "@/assets/cat-oppvask.jpg";
import catKombi from "@/assets/cat-kombi.jpg";
import catMaskiner from "@/assets/cat-maskiner.jpg";
import catPizza from "@/assets/cat-pizza.jpg";
import catKjolerom from "@/assets/cat-kjolerom.jpg";
import catKaffe from "@/assets/cat-kaffe.jpg";
import catServering from "@/assets/cat-servering.jpg";
import catRengjoring from "@/assets/cat-rengjoring.jpg";
import { Reveal } from "./Reveal";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const CATEGORY_IMAGE_BY_ID: Record<string, StaticImageData> = {
  "kok-stek": catKokStek,
  kjoling: catKjoling,
  oppvask: catOppvask,
  kombi: catKombi,
  maskiner: catMaskiner,
  pizza: catPizza,
  kjolerom: catKjolerom,
  kaffe: catKaffe,
  servering: catServering,
  rengjoring: catRengjoring,
};

const CATEGORIES = MEGA_MENU_TREE.map((main) => ({
  id: main.id,
  name: main.label,
  count: main.count,
  img: CATEGORY_IMAGE_BY_ID[main.id],
})).filter(
  (c): c is { id: string; name: string; count: number; img: StaticImageData } => c.img != null,
);

export type CategoriesProps = {
  /** Hide footer link when already on /kategorier */
  showSeeAllLink?: boolean;
  locale?: Locale;
};

export function Categories({ showSeeAllLink = true, locale = "nb" }: CategoriesProps) {
  return (
    <section className="bg-white section-pad border-b border-[var(--color-divider)]">
      <div className="container-x">
        {/* Header — split layout to use horizontal space */}
        <Reveal>
          <div className="mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-xl">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Kategorier", "Categories")}
              </span>
              <h2 className="display-h2 mt-4 text-[var(--color-ink)]">
                {tr(locale, "Finn riktig utstyr — raskt.", "Find the right equipment fast.")}
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-[1.65] text-[var(--color-muted)] lg:text-right">
              {tr(
                locale,
                "Klikk en kategori for å se alle produkter, merker og spesifikasjoner.",
                "Click a category to view all products, brands, and specifications.",
              )}
            </p>
          </div>
        </Reveal>

        {/* 5-col grid (2 rows of 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={Math.min(i * 0.04, 0.32)}>
              <Link
                href="/produkter"
                className="group block bg-white relative overflow-hidden rounded-[3px] border border-[var(--color-divider)] hover:border-[var(--color-copper)] hover:shadow-[0_16px_32px_-12px_oklch(0.18_0.005_60/0.18)] transition-all duration-300 h-full"
              >
                <div className="aspect-[3/4] flex flex-col">
                  <div className="flex-[7] relative overflow-hidden">
                    <Image
                      src={cat.img}
                      alt={cat.name}
                      loading="lazy"
                      width={768}
                      height={1024}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.005_60/0.5)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2.5 left-2.5 text-[10px] font-mono text-white/95 tracking-[0.1em] z-10 bg-[oklch(0.18_0.005_60/0.55)] backdrop-blur-sm px-1.5 py-0.5 rounded-[2px]">
                      /{String(i + 1).padStart(2, "0")}
                    </div>
                    <ArrowUpRight
                      className="absolute top-2.5 right-2.5 h-5 w-5 text-white opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"
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

        {showSeeAllLink && (
          <div className="mt-10 flex justify-end">
            <Link
              href="/kategorier"
              className="group inline-flex items-center gap-1.5 text-[var(--color-copper)] text-[14px] font-medium hover:gap-2.5 transition-all"
            >
              {tr(locale, "Se alle kategorier", "See all categories")}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
