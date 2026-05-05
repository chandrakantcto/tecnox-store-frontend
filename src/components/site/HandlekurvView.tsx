"use client";

import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { TopBar } from "@/components/site/TopBar";
import { useCart, formatNOK } from "@/contexts/CartContext";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-combi.jpg";

export function HandlekurvView() {
  const { detailedItems, subtotal, updateQty, removeItem, itemCount } = useCart();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav />
      </header>

      <PageHero
        label="Handlekurv"
        title={<>Din kurv ({itemCount} {itemCount === 1 ? "vare" : "varer"})</>}
        crumbs={[{ label: "Handlekurv" }]}
        bgImage={heroImg}
      />

      <section className="section-pad bg-[var(--color-stone)] pt-12 lg:pt-16">
        <div className="container-x">
          {detailedItems.length === 0 ? (
            <Reveal>
              <div className="mx-auto max-w-xl py-16 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-divider)] text-[var(--color-muted)]">
                  <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h2 className="display-h3 mt-6 text-[var(--color-ink)]">Handlekurven er tom.</h2>
                <p className="mt-4 text-[15px] text-[var(--color-muted)]">
                  Bla gjennom utvalget vårt og legg til produkter du ønsker tilbud på.
                </p>
                <div className="mt-8">
                  <Link href="/produkter" className="btn-primary inline-flex">
                    Se produkter
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
              <Reveal>
                <div className="divide-y divide-[var(--color-divider)] rounded-[3px] border border-[var(--color-divider)] bg-white">
                  {detailedItems.map(({ product, qty, lineTotal }) => (
                    <div
                      key={product.slug}
                      className="grid grid-cols-[88px_1fr] items-start gap-4 p-5 sm:grid-cols-[120px_1fr_auto] lg:p-6 lg:gap-6"
                    >
                      <Link
                        href={`/produkter/${product.slug}`}
                        className="relative block aspect-square overflow-hidden rounded-[2px] bg-[oklch(0.94_0.005_80)]"
                      >
                        <Image
                          src={product.img}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </Link>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{product.brand}</p>
                        <Link
                          href={`/produkter/${product.slug}`}
                          className="mt-1 block text-[15px] font-bold tracking-[-0.015em] text-[var(--color-ink)] hover:text-[var(--color-copper)]"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1.5 truncate font-mono text-[12px] text-[var(--color-muted)]">{product.spec}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-stretch overflow-hidden rounded-[2px] border border-[var(--color-ink)]">
                            <button
                              type="button"
                              onClick={() => updateQty(product.slug, qty - 1)}
                              className="px-2.5 transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-stone)]"
                              aria-label="Reduser"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-10 px-4 py-2 text-center text-[13px] font-bold">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(product.slug, qty + 1)}
                              className="px-2.5 transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-stone)]"
                              aria-label="Øk"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(product.slug)}
                            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-copper)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Fjern
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-right sm:col-span-1">
                        <p className="text-[12px] text-[var(--color-muted)]">kr {formatNOK(product.priceNumeric)} eks. MVA</p>
                        <p className="mt-1 text-[18px] font-bold tracking-[-0.015em] text-[var(--color-copper)]">kr {formatNOK(lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/produkter" className="btn-outline-dark">
                    ← Fortsett å handle
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <aside className="rounded-[3px] bg-[var(--color-dark-bg)] p-6 text-[var(--color-stone)] lg:sticky lg:top-28 lg:p-8">
                  <h3 className="text-[18px] font-bold tracking-[-0.02em] text-white">Sammendrag</h3>

                  <dl className="mt-6 space-y-3 text-[14px]">
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-dark-muted)]">Antall varer</dt>
                      <dd>{itemCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-dark-muted)]">Sum (eks. MVA)</dt>
                      <dd className="font-mono">kr {formatNOK(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-dark-muted)]">Frakt og montering</dt>
                      <dd className="text-[12px] text-[var(--color-dark-muted)]">Beregnes ved tilbud</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex items-baseline justify-between border-t border-[var(--color-dark-border)] pt-5">
                    <span className="text-[12px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">Estimert total</span>
                    <span className="text-[24px] font-bold tracking-[-0.02em] text-[var(--color-copper)]">kr {formatNOK(subtotal)}</span>
                  </div>

                  <Link href="/kasse" className="btn-primary mt-7 flex w-full justify-center">
                    Gå til tilbudsforespørsel
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <p className="mt-4 text-[11px] leading-[1.6] text-[var(--color-dark-muted)]">
                    Send som tilbudsforespørsel og få fastpris med leveranse, montering og opplæring innen 24 timer.
                  </p>
                </aside>
              </Reveal>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
