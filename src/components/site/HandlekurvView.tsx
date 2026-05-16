"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { TopBar } from "@/components/site/TopBar";
import { formatNOK, useCart } from "@/contexts/CartContext";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { ConfirmDialog } from "@/components/ui/storefront-dialogs";
import { ShoppingBag, Minus, Plus, ArrowRight, Trash2 } from "lucide-react";
import heroImg from "@/assets/hero-combi.jpg";

export function HandlekurvView({
  megaMenuByLocale,
  locale = "nb",
}: {
  megaMenuByLocale?: MegaMenuLocales;
  locale?: Locale;
}) {
  const {
    lines,
    subtotal,
    itemCount,
    loading,
    syncing,
    bootstrapError,
    lastActionError,
    updateLineQuantity,
    removeLine,
    emptyCart,
    clearLastActionError,
  } = useCart();

  const [emptyCartConfirmOpen, setEmptyCartConfirmOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar locale={locale} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>

      <PageHero
        label="Handlekurv"
        title={<>Din kurv ({itemCount} {itemCount === 1 ? "vare" : "varer"})</>}
        crumbs={[{ label: "Handlekurv" }]}
        bgImage={heroImg}
      />

      <section className="section-pad bg-[var(--color-stone)] pt-12 lg:pt-16">
        <div className="container-x">
          {bootstrapError ? (
            <Reveal>
              <div className="mb-8 rounded-[3px] border border-red-700/35 bg-white px-4 py-3 text-[14px] text-red-800">
                Kunne ikke hente handlekurven: {bootstrapError}. Sjekk at nettbutikk-API (
                <code>NEXT_PUBLIC_VENDURE_SHOP_API_URL</code>) og kanal-token er konfigurert for denne storefront-prosessen.
              </div>
            </Reveal>
          ) : null}

          {lastActionError ? (
            <Reveal>
              <button
                type="button"
                onClick={() => clearLastActionError()}
                className="mb-6 w-full rounded-[3px] border border-[var(--color-copper)]/40 bg-white px-4 py-3 text-left text-[14px] text-[var(--color-ink)]"
              >
                <span className="font-semibold text-[var(--color-copper)]">Kundeoppdatering:</span> {lastActionError}
                <span className="block text-[12px] text-[var(--color-muted)]">Trykk for å lukke meldingen.</span>
              </button>
            </Reveal>
          ) : null}

          {loading ? (
            <Reveal>
              <p className="py-24 text-center text-[15px] text-[var(--color-muted)]">Laster inn handlekurven…</p>
            </Reveal>
          ) : lines.length === 0 ? (
            <Reveal>
              <div className="mx-auto max-w-xl py-16 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-divider)] text-[var(--color-muted)]">
                  <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h2 className="display-h3 mt-6 text-[var(--color-ink)]">Handlekurven er tom.</h2>
                <p className="mt-4 text-[15px] text-[var(--color-muted)]">
                  Bla gjennom utvalget vårt og legg produkter i kurven direkte fra produktsidene — priser og beholdning synkroniseres fra Vendure.
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
                  {lines.map((line) => (
                    <div
                      key={line.orderLineId}
                      className="grid grid-cols-[88px_1fr] items-start gap-4 p-5 sm:grid-cols-[120px_1fr_auto] lg:p-6 lg:gap-6"
                    >
                      <Link
                        href={`/produkter/${encodeURIComponent(line.productSlug)}`}
                        className="relative block aspect-square overflow-hidden rounded-[2px] bg-[oklch(0.94_0.005_80)]"
                      >
                        {line.imageSrc ? (
                          <Image
                            src={line.imageSrc}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[oklch(0.93_0.01_85)]" />
                        )}
                      </Link>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{line.brand}</p>
                        <Link
                          href={`/produkter/${encodeURIComponent(line.productSlug)}`}
                          className="mt-1 block text-[15px] font-bold tracking-[-0.015em] text-[var(--color-ink)] hover:text-[var(--color-copper)]"
                        >
                          {line.productName}
                        </Link>
                        <p className="mt-1.5 truncate font-mono text-[12px] text-[var(--color-muted)]">{line.spec}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-stretch overflow-hidden rounded-[2px] border border-[var(--color-ink)]">
                            <button
                              type="button"
                              disabled={syncing}
                              onClick={() => void updateLineQuantity(line.orderLineId, line.quantity - 1)}
                              className="px-2.5 transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-stone)] disabled:opacity-50"
                              aria-label="Reduser"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-10 px-4 py-2 text-center text-[13px] font-bold">{line.quantity}</span>
                            <button
                              type="button"
                              disabled={syncing}
                              onClick={() => void updateLineQuantity(line.orderLineId, line.quantity + 1)}
                              className="px-2.5 transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-stone)] disabled:opacity-50"
                              aria-label="Øk"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={syncing}
                            onClick={() => void removeLine(line.orderLineId)}
                            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-copper)] disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Fjern
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-right sm:col-span-1">
                        <p className="text-[12px] text-[var(--color-muted)]">kr {formatNOK(Math.round(line.unitPriceKr))} eks. MVA</p>
                        <p className="mt-1 text-[18px] font-bold tracking-[-0.015em] text-[var(--color-copper)]">
                          kr {formatNOK(Math.round(line.lineTotalKr))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/produkter" className="btn-outline-dark">
                    ← {tr(locale, "Fortsett å handle", "Continue shopping")}
                  </Link>
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={() => setEmptyCartConfirmOpen(true)}
                    className="inline-flex items-center gap-2 text-[13px] text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-copper)] hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {tr(locale, "Tøm handlekurv", "Empty cart")}
                  </button>
                </div>

                <ConfirmDialog
                  open={emptyCartConfirmOpen}
                  onOpenChange={setEmptyCartConfirmOpen}
                  title={tr(
                    locale,
                    "Fjerne alle varer fra handlekurven?",
                    "Remove all items from your cart?",
                  )}
                  cancelLabel={tr(locale, "Avbryt", "Cancel")}
                  confirmLabel={tr(locale, "Tøm handlekurv", "Empty cart")}
                  destructive
                  onConfirm={() => void emptyCart()}
                />
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
                      <dd className="font-mono">kr {formatNOK(Math.round(subtotal))}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex items-baseline justify-between border-t border-[var(--color-dark-border)] pt-5">
                    <span className="text-[12px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">Total eks. MVA</span>
                    <span className="text-[24px] font-bold tracking-[-0.02em] text-[var(--color-copper)]">
                      kr {formatNOK(Math.round(subtotal))}
                    </span>
                  </div>

                  <Link href="/kasse" className="btn-primary mt-7 flex w-full justify-center opacity-100">
                    Til kassen
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <p className="mt-4 text-[11px] leading-[1.6] text-[var(--color-dark-muted)]">
                    Bestillingen sendes gjennom Vendure Shop API og behandles videre fra Admin når ordren er betalt eller manuelt bokført.
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
