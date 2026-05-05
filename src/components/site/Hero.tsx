"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { ArrowRight, ShieldCheck, Truck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import heroCombi from "@/assets/hero-combi.jpg";
import heroRestaurant from "@/assets/ref-restaurant.jpg";
import heroHotell from "@/assets/ref-hotell.jpg";
import heroKantine from "@/assets/ref-kantine.jpg";
import heroKjoling from "@/assets/cat-kjoling.jpg";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const SLIDE_INTERVAL_MS = 3000;

type HeroSlide = {
  id: string;
  image: StaticImageData;
  alt: string;
  spec: string;
  badge: string;
  ctaLine: string;
  ctaHref: string;
};

const SLIDES: HeroSlide[] = [
  {
    id: "combi",
    image: heroCombi,
    alt: "Profesjonell kombidamper for storhusholdning",
    spec: "Rational · iCombi Pro",
    badge: "NYHET",
    ctaLine: "Kombidampere 2025-serien",
    ctaHref: "/produkter",
  },
  {
    id: "restaurant",
    image: heroRestaurant,
    alt: "Kjøkkenløsning for restaurant og HoReCa",
    spec: "Prosjektering · Montering",
    badge: "REFERANSE",
    ctaLine: "Se utvalgte prosjekter",
    ctaHref: "/service",
  },
  {
    id: "hotell",
    image: heroHotell,
    alt: "Storkjøkken for hotell og konferanse",
    spec: "Hotell & storhusholdning",
    badge: "24/7 SERVICE",
    ctaLine: "Serviceavtaler for drift",
    ctaHref: "/service",
  },
  {
    id: "kantine",
    image: heroKantine,
    alt: "Kantine og institusjonskjøkken",
    spec: "Kantine · Skole · Offentlig",
    badge: "KOMPLETT",
    ctaLine: "Be om tilbud til kantine",
    ctaHref: "/kontakt",
  },
  {
    id: "kjoling",
    image: heroKjoling,
    alt: "Kjøle- og frysutstyr for profesjonelt kjøkken",
    spec: "Gram · Kjøl & frys",
    badge: "LAGER",
    ctaLine: "Utforsk kjøleutstyr",
    ctaHref: "/produkter",
  },
];

const TRUST = [
  { icon: Truck, label: "Rask levering" },
  { icon: Wrench, label: "Montering & service" },
  { icon: ShieldCheck, label: "30 års erfaring" },
];

export function Hero({ locale = "nb" }: { locale?: Locale }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = SLIDES.length;

  const go = useCallback(
    (next: number) => {
      setIndex(((next % len) + len) % len);
    },
    [len],
  );

  useEffect(() => {
    if (paused || len <= 1) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % len);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, len]);

  const slide = SLIDES[index];

  return (
    <section className="bg-[var(--color-stone)] text-[var(--color-ink)] relative overflow-hidden border-b border-[var(--color-divider)]">
      {/* subtle TECNOX blue accent */}
      <div
        className="absolute inset-0 opacity-[0.6] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 90% 10%, oklch(0.72 0.12 236 / 0.12) 0%, transparent 50%)",
        }}
      />

      <div className="container-x grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 pt-14 pb-16 lg:pt-20 lg:pb-24 relative">
        {/* Left */}
        <div className="flex flex-col justify-center reveal">
          <span className="label-tag mb-5 inline-flex items-center gap-2">
            <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
            {tr(locale, "Profesjonelt kjøkkenutstyr", "Professional kitchen equipment")}
          </span>

          <h1 className="display-h1 text-[var(--color-ink)]">
            {tr(locale, "Kjøkkenet er hjertet —", "The kitchen is the heart —")}
            <br />
            <span className="italic font-normal text-[var(--color-copper)]">
              {tr(locale, "utstyr", "equip")}
            </span>{" "}
            {tr(locale, "det deretter.", "it accordingly.")}
          </h1>

          <p className="mt-6 max-w-[500px] text-[15px] lg:text-[16px] leading-[1.7] text-[var(--color-muted)]">
            {tr(
              locale,
              "Over 5 000 produkter for restaurant, kantine og storhusholdning. Vi hjelper deg finne rett løsning — og leverer over hele Norge.",
              "Over 5,000 products for restaurants, canteens, and foodservice. We help you find the right solution and deliver across Norway.",
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/produkter" className="btn-primary group">
              {tr(locale, "Utforsk produkter", "Explore products")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/kontakt" className="btn-outline-dark">
              {tr(locale, "Be om tilbud", "Request a quote")}
            </Link>
          </div>

          {/* Trust row — denser, icon-led */}
          <div className="mt-10 pt-6 border-t border-[var(--color-divider)] flex flex-wrap gap-x-7 gap-y-3">
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[13px] text-[var(--color-ink)]">
                <Icon className="h-4 w-4 text-[var(--color-copper)]" strokeWidth={1.75} />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — image with stat overlay */}
        <div
          className="relative h-[380px] sm:h-[460px] lg:h-auto lg:min-h-[540px] reveal"
          style={{ animationDelay: "120ms" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute inset-0 overflow-hidden rounded-[4px] border border-[var(--color-divider)] shadow-[0_30px_60px_-25px_oklch(0.18_0.005_60/0.3)]">
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-out",
                  i === index ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none",
                )}
                aria-hidden={i !== index}
              >
                <Image
                  src={s.image}
                  alt={s.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          {/* Slide dots */}
          <div
            className="absolute bottom-[5.5rem] left-1/2 z-[3] flex -translate-x-1/2 gap-2 sm:bottom-[5.25rem]"
            role="tablist"
            aria-label={tr(locale, "Velg slides", "Select slides")}
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}: ${s.alt}`}
                onClick={() => go(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index
                    ? "w-8 bg-[var(--color-copper)]"
                    : "w-2 bg-white/70 hover:bg-white border border-[var(--color-divider)]/60",
                )}
              />
            ))}
          </div>

          {/* Floating chip — bottom-left */}
          <Link
            href={slide.ctaHref}
            className="absolute bottom-4 left-4 right-4 z-[2] sm:right-auto bg-white text-[var(--color-ink)] text-[12px] font-medium pl-3.5 pr-4 py-3 rounded-[3px] shadow-xl flex items-center gap-2.5 hover:bg-[var(--color-ink)] hover:text-white transition-colors group"
          >
            <span className="bg-[var(--color-copper)] text-white text-[9px] font-bold tracking-[0.14em] px-1.5 py-0.5 rounded-[2px]">
              {slide.badge}
            </span>
            <span className="flex-1">{slide.ctaLine}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Spec chip top-right */}
          <div className="absolute top-4 right-4 z-[2] bg-white/95 backdrop-blur-sm border border-[var(--color-divider)] text-[var(--color-ink)] text-[10px] font-semibold px-2.5 py-1.5 rounded-[2px] uppercase tracking-[0.14em]">
            {slide.spec}
          </div>

          {/* Stat overlay — bottom-right corner card */}
          <div className="hidden lg:block absolute -bottom-8 -left-6 bg-[var(--color-ink)] text-white px-5 py-4 rounded-[3px] shadow-2xl border border-[oklch(0.28_0_0)]">
            <p className="text-[28px] font-bold leading-none tracking-[-0.025em]">5 000+</p>
            <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
              {tr(locale, "Produkter på lager", "Products in stock")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
