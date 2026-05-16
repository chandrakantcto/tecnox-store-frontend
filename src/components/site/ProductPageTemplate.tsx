"use client";

/**
 * Single-product layout: gallery & variant-aware buy box, highlights, specs, reviews, quote, related.
 */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/site/TopBar";
import { MainNav } from "@/components/site/MainNav";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import {
  cartSnapshotFromProduct,
  type LocalizedBulletBundle,
  type Product,
  type StorefrontVariantDetail,
} from "@/lib/catalog/storefront-product";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { useCart } from "@/contexts/CartContext";
import { Check, ChevronDown, Minus, Plus, ShoppingBag, Star, ShieldCheck, Truck, Wrench } from "lucide-react";

export type ProductPageTemplateProps = {
  product: Product;
  relatedProducts?: Product[];
  locale?: Locale;
  megaMenuByLocale?: MegaMenuLocales;
};

export function ProductPageTemplate({
  product,
  relatedProducts = [],
  locale = "nb",
  megaMenuByLocale,
}: ProductPageTemplateProps) {
  const router = useRouter();
  const { addItemFromSnapshot, syncing, lastActionError, clearLastActionError } = useCart();
  const variants = product.variants ?? [];
  const [selectedVid, setSelectedVid] = useState(() => {
    const v = product.hydratedVariantId ?? product.defaultVariantId ?? variants[0]?.id ?? "";
    return v;
  });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const effectiveVariant = useMemo((): StorefrontVariantDetail | null => {
    if (!variants.length) return null;
    return variants.find((v) => v.id === selectedVid) ?? variants[0] ?? null;
  }, [variants, selectedVid]);

  useEffect(() => {
    const v =
      product.hydratedVariantId ??
      product.defaultVariantId ??
      product.variants?.[0]?.id ??
      "";
    if (v) setSelectedVid(v);
  }, [product.slug, product.hydratedVariantId, product.defaultVariantId, product.variants?.[0]?.id]);

  const gallery = product.galleryImageUrls?.length ? product.galleryImageUrls : [product.img];

  useEffect(() => {
    if (!effectiveVariant?.imageSrc?.trim()) return;
    const idx = gallery.findIndex((u) => u === effectiveVariant.imageSrc);
    if (idx >= 0) setActiveImg(idx);
  }, [effectiveVariant?.id, effectiveVariant?.imageSrc, gallery]);

  const mainImageSrc = gallery[Math.min(activeImg, gallery.length - 1)] ?? product.img;

  const displayPrice =
    effectiveVariant?.priceLabelExVat ??
    variants.find((x) => x.id === selectedVid)?.priceLabelExVat ??
    product.price;

  const specLineBelowTitle =
    effectiveVariant?.sku
      ? `SKU · ${effectiveVariant.sku}`
      : effectiveVariant?.options?.length
        ? effectiveVariant.options.map((o) => o.name).join(" · ")
        : product.spec;

  const specsForTable = effectiveVariant?.specs?.length ? effectiveVariant.specs : product.specs;

  const pickVariant = (id: string) => {
    setSelectedVid(id);
    router.replace(`/produkter/${encodeURIComponent(product.slug)}?v=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  const variantLabelOption = (v: StorefrontVariantDetail) =>
    v.options?.length ? v.options.map((o) => o.name).join(" · ") || v.name : v.name || v.sku;

  const handleAdd = async () => {
    clearLastActionError();
    setCartMessage(null);
    const snap = cartSnapshotFromProduct(product, effectiveVariant);
    const res = await addItemFromSnapshot(snap, qty);
    if (!res.ok) {
      setCartMessage(res.message);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const serviceLines = bulletsForLocale(product.serviceBulletsLocalized, locale);
  const quoteAsideLines = bulletsForLocale(product.quoteBulletsLocalized, locale);
  const svcIcons = [Truck, Wrench, ShieldCheck];

  const reviews = product.reviews ?? [];

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar locale={locale} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>

      <PageHero
        label={product.category}
        title={product.name}
        crumbs={[
          { label: tr(locale, "Produkter", "Products"), to: "/produkter" },
          { label: product.name },
        ]}
        bgImage={mainImageSrc}
      />

      <section className="bg-[var(--color-stone)] py-12 lg:py-16">
        <div className="container-x grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16">
          <Reveal>
            <div>
              <div className="aspect-[4/3] bg-white border border-[var(--color-divider)] rounded-[3px] overflow-hidden relative">
                {product.badge && (
                  <span className="absolute top-3 left-3 z-10 bg-[var(--color-copper)] text-white text-[10px] font-bold tracking-[0.14em] px-2 py-1 rounded-[2px] shadow-sm">
                    {product.badge}
                  </span>
                )}
                <Image
                  src={mainImageSrc}
                  alt={product.name}
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover transition-all duration-500"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              </div>
              {gallery.length > 1 ? (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {gallery.slice(0, 10).map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={`aspect-[4/3] bg-white border rounded-[2px] overflow-hidden transition-all ${
                        activeImg === i
                          ? "border-[var(--color-copper)] ring-1 ring-[var(--color-copper)]"
                          : "border-[var(--color-divider)] hover:border-[var(--color-ink)]"
                      }`}
                      aria-label={tr(locale, `Bilde ${i + 1}`, `Image ${i + 1}`)}
                    >
                      <Image
                        src={src}
                        alt=""
                        width={320}
                        height={240}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="lg:sticky lg:top-28">
              <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] font-semibold">{product.brand}</p>
              <h1 className="mt-3 text-[26px] lg:text-[32px] font-bold text-[var(--color-ink)] tracking-[-0.025em] leading-[1.1]">
                {product.name}
              </h1>
              <p className="mt-3 font-mono text-[13px] text-[var(--color-muted)]">{specLineBelowTitle}</p>

              {effectiveVariant?.stockLevel?.trim() ? (
                <p className="mt-2 text-[12px] text-[var(--color-muted)]">
                  {tr(locale, "Beholdningsstatus:", "Availability:")}{" "}
                  <span className="font-mono text-[var(--color-ink)]">{effectiveVariant.stockLevel}</span>
                </p>
              ) : null}

              {variants.length > 1 ? (
                <div className="mt-6">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] mb-2">
                    {tr(locale, "Velg variant", "Choose configuration")}
                  </label>
                  <div className="relative max-w-md">
                    <select
                      value={selectedVid}
                      onChange={(e) => pickVariant(e.target.value)}
                      className="w-full appearance-none bg-white border border-[var(--color-divider)] rounded-[2px] px-4 py-3 pr-10 text-[14px] font-medium text-[var(--color-ink)] cursor-pointer hover:border-[var(--color-copper)] focus:outline-none focus:border-[var(--color-copper)]"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {variantLabelOption(v)} — {v.priceLabelExVat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                  </div>
                </div>
              ) : null}

              <p className="mt-6 text-[28px] font-bold text-[var(--color-copper)] tracking-[-0.02em]">{displayPrice}</p>
              <p className="text-[12px] text-[var(--color-muted)]">
                {tr(locale, "Frakt beregnes ved tilbud", "Shipping calculated in quote")}
              </p>

              {product.descriptionHtml?.trim() ? (
                <div
                  className="mt-6 text-[15px] leading-[1.7] text-[var(--color-ink)]/85 prose-like [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mt-4 first:[&_p]:mt-0"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              ) : (
                <p className="mt-6 text-[15px] leading-[1.7] text-[var(--color-ink)]/85">{product.description}</p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-stretch border border-[var(--color-ink)] rounded-[2px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-stone)] transition-colors"
                    aria-label={tr(locale, "Reduser antall", "Decrease quantity")}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-5 py-2.5 min-w-12 text-center font-bold text-[14px]">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-stone)] transition-colors"
                    aria-label={tr(locale, "Øk antall", "Increase quantity")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button type="button" onClick={() => void handleAdd()} disabled={syncing} className="btn-primary disabled:opacity-60">
                  <ShoppingBag className="h-4 w-4" />
                  {added ? tr(locale, "Lagt til", "Added") : syncing ? tr(locale, "Legger til …", "Adding …") : tr(locale, "Legg i kurv", "Add to cart")}
                </button>
                <Link href="/kontakt" className="btn-outline-dark">
                  {tr(locale, "Be om tilbud", "Request a quote")}
                </Link>
              </div>

              {added && (
                <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--color-copper)]">
                  <Check className="h-4 w-4" /> {tr(locale, "Produktet er lagt i handlekurven.", "Product added to cart.")}
                </p>
              )}
              {(cartMessage || lastActionError) && (
                <p className="mt-3 text-[13px] text-red-700" role="alert">
                  {cartMessage ?? lastActionError}
                </p>
              )}

              <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--color-divider)] pt-6">
                {serviceLines.map((line, i) => {
                  const Icon = svcIcons[i % svcIcons.length]!;
                  return (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-muted)]">
                      <Icon className="h-4 w-4 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                      {line}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-stone)] pb-12 lg:pb-20">
        <div className="container-x grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
          <Reveal>
            <div>
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Høydepunkter", "Highlights")}
              </span>
              <h2 className="mt-5 display-h3 text-[var(--color-ink)]">
                {tr(locale, "Hvorfor fagfolk velger denne.", "Why professionals choose this model.")}
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="space-y-4">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[var(--color-copper)] text-white inline-flex items-center justify-center">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] text-[var(--color-ink)] leading-[1.6]">{h}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-dark-bg)] text-[var(--color-stone)] py-16 lg:py-24">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl mb-10">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Tekniske spesifikasjoner", "Technical specifications")}
              </span>
              <h2 className="mt-5 display-h3 text-white">
                {tr(locale, "Alt du trenger å vite — i tall.", "Everything you need to know - in numbers.")}
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-x-auto border border-[var(--color-dark-border)] rounded-[3px]">
              <table className="w-full text-[14px]">
                <tbody>
                  {specsForTable.map((s, i) => (
                    <tr
                      key={`${s.label}-${i}`}
                      className={i % 2 === 0 ? "bg-[oklch(0.18_0_0)]" : "bg-[oklch(0.21_0_0)]"}
                    >
                      <th className="text-left px-5 py-4 text-[12px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)] font-semibold w-1/2 lg:w-1/3">
                        {s.label}
                      </th>
                      <td className="px-5 py-4 text-white font-mono">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {reviews.length > 0 ? (
        <section className="bg-[var(--color-stone)] py-16 lg:py-24 border-y border-[var(--color-divider)]">
          <div className="container-x">
            <Reveal>
              <div className="mb-10 max-w-3xl">
                <span className="label-tag inline-flex items-center gap-2">
                  <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                  {tr(locale, "Kundeanmeldelser", "Customer reviews")}
                </span>
                <h2 className="display-h3 mt-5 text-[var(--color-ink)]">
                  {tr(locale, "Stemmer fra kjøkkengulvet.", "Straight from professional kitchens.")}
                </h2>
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <Reveal key={`${r.author}-${i}`} delay={i * 0.05}>
                  <article className="h-full bg-white border border-[var(--color-divider)] rounded-[3px] p-6 flex flex-col">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: r.rating }, (_, ri) => (
                        <Star key={ri} className="h-3.5 w-3.5 fill-[var(--color-copper)] text-[var(--color-copper)]" />
                      ))}
                    </div>
                    <h3 className="mt-3 text-[16px] font-bold text-[var(--color-ink)] leading-snug">
                      {r.title?.trim()
                        ? r.title
                        : tr(locale, "Anbefales", "Recommended")}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.65] text-[var(--color-ink)]/88 flex-1">{r.body}</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      {r.author}
                      {r.dateIso?.trim()
                        ? ` · ${locale === "en" ? formatIsoShortEn(r.dateIso) : formatIsoShortNb(r.dateIso)}`
                        : ""}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ProductQuoteSection productSlug={product.slug} productName={product.name} locale={locale} quoteLines={quoteAsideLines} />

      {relatedProducts.length > 0 && (
        <section className="bg-[var(--color-stone)] py-16 lg:py-24">
          <div className="container-x">
            <Reveal>
              <div className="mb-10 max-w-3xl">
                <span className="label-tag inline-flex items-center gap-2">
                  <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                  {tr(locale, "Lignende produkter", "Similar products")}
                </span>
                <h2 className="display-h3 mt-5 text-[var(--color-ink)]">
                  {tr(locale, "Andre i samme kategori.", "Others in the same category.")}
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-fr items-stretch gap-4 lg:gap-6">
              {relatedProducts.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.06} className="h-full min-h-0">
                  <Link href={`/produkter/${p.slug}`} className="group card-elevated flex h-full min-h-0 flex-col">
                    <div className="aspect-[4/3] overflow-hidden bg-[oklch(0.94_0.005_80)]">
                      <Image
                        src={p.img}
                        alt={p.name}
                        loading="lazy"
                        width={1024}
                        height={768}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[14px] font-bold text-[var(--color-ink)] leading-snug">{p.name}</h3>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-muted)] font-medium">{p.brand}</p>
                      <p className="mt-2 text-[13px] font-bold text-[var(--color-copper)]">{p.price}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

function bulletsForLocale(bundle: LocalizedBulletBundle | null | undefined, locale: Locale): string[] {
  if (!bundle) {
    return [
      tr(locale, "Levering hele Norge", "Delivery across Norway"),
      tr(locale, "Montering og opplæring", "Installation and training"),
      tr(locale, "2 års garanti", "2-year warranty"),
    ];
  }
  const key = locale === "en" ? "en" : "nb";
  const lines =
    bundle[key]?.length ?? 0 ? bundle[key]! : [...(bundle.nb.length ? bundle.nb : bundle.en)];
  if (!lines?.length) {
    return [
      tr(locale, "Levering hele Norge", "Delivery across Norway"),
      tr(locale, "Montering og opplæring", "Installation and training"),
      tr(locale, "2 års garanti", "2-year warranty"),
    ];
  }
  return lines.slice(0, 6);
}

function formatIsoShortNb(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatIsoShortEn(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function ProductQuoteSection({
  productSlug,
  productName,
  locale,
  quoteLines,
}: {
  productSlug: string;
  productName: string;
  locale: Locale;
  quoteLines: string[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="bg-[var(--color-stone)] py-16 lg:py-20 border-t border-[var(--color-divider)]">
      <div className="container-x grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
        <Reveal>
          <div>
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Be om tilbud", "Request a quote")}
            </span>
            <h2 className="mt-5 display-h3 text-[var(--color-ink)]">
              {tr(locale, "Ønsker du pris og leveringstid?", "Need pricing and delivery time?")}
            </h2>
            <p className="mt-4 text-[15px] text-[var(--color-muted)] leading-[1.65] max-w-md">
              {tr(
                locale,
                "Send forespørsel og få et skreddersydd tilbud — inkludert montering, opplæring og service. Vi svarer innen 24 timer.",
                "Send a request and receive a tailored quote including installation, training, and service. We reply within 24 hours.",
              )}
            </p>
            <ul className="mt-8 space-y-3 text-[13px] text-[var(--color-muted)]">
              {quoteLines.map((txt, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--color-copper)] shrink-0" /> {txt}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          {submitted ? (
            <div className="bg-white border border-[var(--color-divider)] p-10 rounded-[3px] text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-copper)] text-white">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-[20px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
                {tr(locale, "Takk! Vi er på saken.", "Thanks! We are on it.")}
              </h3>
              <p className="mt-3 text-[14px] text-[var(--color-muted)]">
                {tr(locale, "En av våre fagfolk tar kontakt innen 24 timer.", "One of our specialists will contact you within 24 hours.")}
              </p>
            </div>
          ) : (
            <form
              className="bg-white border border-[var(--color-divider)] p-6 lg:p-8 rounded-[3px] space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                const fd = new FormData(e.currentTarget);
                const body = {
                  name: fd.get("name"),
                  company: fd.get("company"),
                  email: fd.get("email"),
                  phone: fd.get("phone"),
                  message: fd.get("message"),
                  productSlug,
                  productName,
                  locale,
                };
                setSubmitting(true);
                try {
                  const res = await fetch("/api/storefront/quote-request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  const json = (await res.json()) as { ok?: boolean; error?: string };
                  if (!res.ok || !json.ok) {
                    setError(json.error ?? tr(locale, "Kunne ikke sende forespørselen.", "Could not send your request."));
                    return;
                  }
                  setSubmitted(true);
                } catch {
                  setError(tr(locale, "Nettverksfeil — prøv igjen.", "Network error — please try again."));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <QuoteField label={tr(locale, "Navn", "Name")} required type="text" name="name" disabled={submitting} />
                <QuoteField label={tr(locale, "Bedrift", "Company")} type="text" name="company" disabled={submitting} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <QuoteField label={tr(locale, "E-post", "Email")} required type="email" name="email" disabled={submitting} />
                <QuoteField label={tr(locale, "Telefon", "Phone")} type="tel" name="phone" disabled={submitting} />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
                  {tr(locale, "Melding", "Message")}
                </label>
                <textarea
                  name="message"
                  rows={4}
                  required
                  disabled={submitting}
                  defaultValue={tr(locale, `Forespørsel om tilbud på: ${productName}`, `Quote request for: ${productName}`)}
                  className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors resize-none disabled:opacity-60"
                />
              </div>
              {error ? <p className="text-[13px] text-red-700">{error}</p> : null}
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto disabled:opacity-60">
                {submitting
                  ? tr(locale, "Sender…", "Sending…")
                  : tr(locale, "Send tilbudsforespørsel", "Send quote request")}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function QuoteField({
  label,
  required,
  type,
  name,
  disabled,
}: {
  label: string;
  required?: boolean;
  type: string;
  name: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        disabled={disabled}
        className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors disabled:opacity-60"
      />
    </div>
  );
}
