"use client";

/**
 * Reusable single-product layout (gallery, buy box, highlights, specs, quote, related).
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { TopBar } from "@/components/site/TopBar";
import { MainNav } from "@/components/site/MainNav";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { useCart } from "@/contexts/CartContext";
import { Check, Minus, Plus, ShoppingBag, Truck, ShieldCheck, Wrench } from "lucide-react";

export type ProductPageTemplateProps = {
  product: Product;
  /** Same-category or curated picks; empty hides the related section */
  relatedProducts?: Product[];
  locale?: Locale;
};

const GALLERY_ITEMS = [
  { label: "Hovedbilde", crop: "object-cover" },
  { label: "Detalj", crop: "object-cover scale-[1.4] object-left" },
  { label: "Front", crop: "object-cover scale-[1.2] object-right" },
] as const;

export function ProductPageTemplate({
  product,
  relatedProducts = [],
  locale = "nb",
}: ProductPageTemplateProps) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product.slug, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav />
      </header>

      <PageHero
        label={product.category}
        title={product.name}
        crumbs={[
          { label: tr(locale, "Produkter", "Products"), to: "/produkter" },
          { label: product.name },
        ]}
        bgImage={product.img}
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
                  src={product.img}
                  alt={`${product.name} — ${GALLERY_ITEMS[activeImg].label}`}
                  width={1024}
                  height={768}
                  className={`h-full w-full ${GALLERY_ITEMS[activeImg].crop} transition-all duration-500`}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {GALLERY_ITEMS.map((g, i) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`aspect-[4/3] bg-white border rounded-[2px] overflow-hidden transition-all ${
                      activeImg === i
                        ? "border-[var(--color-copper)] ring-1 ring-[var(--color-copper)]"
                        : "border-[var(--color-divider)] hover:border-[var(--color-ink)]"
                    }`}
                    aria-label={g.label}
                  >
                    <Image
                      src={product.img}
                      alt=""
                      width={320}
                      height={240}
                      className={`h-full w-full ${g.crop}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="lg:sticky lg:top-28">
              <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] font-semibold">{product.brand}</p>
              <h1 className="mt-3 text-[26px] lg:text-[32px] font-bold text-[var(--color-ink)] tracking-[-0.025em] leading-[1.1]">
                {product.name}
              </h1>
              <p className="mt-3 font-mono text-[13px] text-[var(--color-muted)]">{product.spec}</p>

              <p className="mt-6 text-[28px] font-bold text-[var(--color-copper)] tracking-[-0.02em]">{product.price}</p>
              <p className="text-[12px] text-[var(--color-muted)]">
                {tr(locale, "Frakt beregnes ved tilbud", "Shipping calculated in quote")}
              </p>

              <p className="mt-6 text-[15px] leading-[1.7] text-[var(--color-ink)]/85">{product.description}</p>

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

                <button type="button" onClick={handleAdd} className="btn-primary">
                  <ShoppingBag className="h-4 w-4" />
                  {added ? tr(locale, "Lagt til", "Added") : tr(locale, "Legg i kurv", "Add to cart")}
                </button>
                <Link href="/kontakt" className="btn-outline-dark">
                  {tr(locale, "Be om tilbud", "Request a quote")}
                </Link>
              </div>

              {added && (
                <p className="mt-3 text-[13px] text-[var(--color-copper)] flex items-center gap-2">
                  <Check className="h-4 w-4" /> {tr(locale, "Produktet er lagt i handlekurven.", "Product added to cart.")}
                </p>
              )}

              <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--color-divider)] pt-6">
                <li className="flex items-start gap-2 text-[12px] text-[var(--color-muted)]">
                  <Truck className="h-4 w-4 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                  {tr(locale, "Levering hele Norge", "Delivery across Norway")}
                </li>
                <li className="flex items-start gap-2 text-[12px] text-[var(--color-muted)]">
                  <Wrench className="h-4 w-4 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                  {tr(locale, "Montering og opplæring", "Installation and training")}
                </li>
                <li className="flex items-start gap-2 text-[12px] text-[var(--color-muted)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                  {tr(locale, "2 års garanti", "2-year warranty")}
                </li>
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
                  {product.specs.map((s, i) => (
                    <tr
                      key={s.label}
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

      <ProductQuoteSection productName={product.name} locale={locale} />

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
              {relatedProducts.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.06}>
                  <Link href={`/produkter/${p.slug}`} className="group card-elevated flex flex-col h-full">
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

function ProductQuoteSection({ productName, locale }: { productName: string; locale: Locale }) {
  const [submitted, setSubmitted] = useState(false);
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
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--color-copper)] shrink-0" /> {tr(locale, "Personlig oppfølging", "Personal follow-up")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--color-copper)] shrink-0" /> {tr(locale, "Volum- og avtalerabatter", "Volume and agreement discounts")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--color-copper)] shrink-0" /> {tr(locale, "Inkluderer leveranse og montering", "Includes delivery and installation")}
              </li>
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
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <input type="hidden" name="product" value={productName} readOnly />
              <div className="grid sm:grid-cols-2 gap-4">
                <QuoteField label={tr(locale, "Navn", "Name")} required type="text" name="name" />
                <QuoteField label={tr(locale, "Bedrift", "Company")} type="text" name="company" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <QuoteField label={tr(locale, "E-post", "Email")} required type="email" name="email" />
                <QuoteField label={tr(locale, "Telefon", "Phone")} type="tel" name="phone" />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
                  {tr(locale, "Melding", "Message")}
                </label>
                <textarea
                  name="message"
                  rows={4}
                  required
                  defaultValue={tr(locale, `Forespørsel om tilbud på: ${productName}`, `Quote request for: ${productName}`)}
                  className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors resize-none"
                />
              </div>
              <button type="submit" className="btn-primary w-full sm:w-auto">
                {tr(locale, "Send tilbudsforespørsel", "Send quote request")}
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
}: {
  label: string;
  required?: boolean;
  type: string;
  name: string;
}) {
  return (
    <div>
      <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors"
      />
    </div>
  );
}
