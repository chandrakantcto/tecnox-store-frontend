"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StorefrontRemoteImage } from "@/components/site/StorefrontRemoteImage";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { formatNOK, useCart } from "@/contexts/CartContext";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { displayBrandName } from "@/lib/brand";

type CartSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale?: Locale;
};

export function CartSidebar({ open, onOpenChange, locale: _locale }: CartSidebarProps) {
  const locale = useActiveLocale();
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
    clearLastActionError,
  } = useCart();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, open, onOpenChange]);

  if (!mounted) return null;

  const productLabel =
    itemCount === 1
      ? tr(locale, "produkt", "product")
      : tr(locale, "produkter", "products");

  const checkoutDisabled = loading || itemCount === 0;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[oklch(0.15_0.02_80_/_0.55)]"
        aria-label={tr(locale, "Lukk handlekurv", "Close cart")}
        tabIndex={open ? 0 : -1}
        onClick={() => onOpenChange(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sidebar-title"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-[-8px_0_32px_-8px_oklch(0.2_0.02_80_/_0.25)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-divider)] px-5 py-5">
          <div>
            <h2 id="cart-sidebar-title" className="text-[20px] font-bold tracking-[-0.02em] text-[var(--color-ink)]">
              {tr(locale, "Handlekurv", "Cart")}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              {itemCount} {productLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] text-[var(--color-ink)] transition-colors hover:bg-[oklch(0.94_0.005_80)] hover:text-[var(--color-copper)]"
            aria-label={tr(locale, "Lukk", "Close")}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {bootstrapError ? (
            <p className="rounded-[3px] border border-red-700/35 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {bootstrapError}
            </p>
          ) : null}

          {lastActionError ? (
            <button
              type="button"
              onClick={() => clearLastActionError()}
              className="mb-4 w-full rounded-[3px] border border-[var(--color-copper)]/40 bg-[var(--color-stone)] px-3 py-2 text-left text-[13px] text-[var(--color-ink)]"
            >
              {lastActionError}
            </button>
          ) : null}

          {loading ? (
            <p className="py-12 text-center text-[14px] text-[var(--color-muted)]">
              {tr(locale, "Laster inn handlekurven…", "Loading cart…")}
            </p>
          ) : lines.length === 0 ? (
            <p className="py-12 text-center text-[14px] text-[var(--color-muted)]">
              {tr(locale, "Din handlekurv er tom.", "Your cart is empty.")}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-divider)]">
              {lines.map((line) => (
                <li key={line.orderLineId} className="grid grid-cols-[80px_1fr] gap-3 py-5 first:pt-0">
                  <Link
                    href={`/produkter/${encodeURIComponent(line.productSlug)}`}
                    onClick={() => onOpenChange(false)}
                    className="relative block aspect-square shrink-0 overflow-hidden rounded-[3px] border border-[var(--color-divider)] bg-[oklch(0.96_0.005_80)]"
                  >
                    <StorefrontRemoteImage
                      src={line.imageSrc}
                      alt=""
                      locale={locale}
                      fill
                      compact
                      className="object-cover"
                    />
                  </Link>

                  <div className="relative flex min-w-0 flex-col">
                    <button
                      type="button"
                      disabled={syncing}
                      onClick={() => void removeLine(line.orderLineId)}
                      className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center text-[var(--color-muted)] transition-colors hover:text-[var(--color-copper)] disabled:opacity-50"
                      aria-label={tr(locale, "Fjern", "Remove")}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>

                    <div className="pr-9">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                        {displayBrandName(line.brand)}
                      </p>
                      <Link
                        href={`/produkter/${encodeURIComponent(line.productSlug)}`}
                        onClick={() => onOpenChange(false)}
                        className="mt-0.5 block text-[14px] font-bold leading-snug text-[var(--color-ink)] hover:text-[var(--color-copper)]"
                      >
                        {line.productName}
                      </Link>
                      <p className="mt-1 truncate font-mono text-[11px] text-[var(--color-muted)]">{line.spec}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="inline-flex items-stretch overflow-hidden rounded-[2px] border border-[var(--color-divider)] bg-white">
                        <button
                          type="button"
                          disabled={syncing}
                          onClick={() => void updateLineQuantity(line.orderLineId, line.quantity - 1)}
                          className="px-2.5 py-1.5 text-[var(--color-muted)] transition-colors hover:bg-[oklch(0.94_0.005_80)] hover:text-[var(--color-ink)] disabled:opacity-50"
                          aria-label={tr(locale, "Reduser", "Decrease")}
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <span className="flex min-w-9 items-center justify-center border-x border-[var(--color-divider)] px-2 py-1.5 text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={syncing}
                          onClick={() => void updateLineQuantity(line.orderLineId, line.quantity + 1)}
                          className="px-2.5 py-1.5 text-[var(--color-muted)] transition-colors hover:bg-[oklch(0.94_0.005_80)] hover:text-[var(--color-ink)] disabled:opacity-50"
                          aria-label={tr(locale, "Øk", "Increase")}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>

                      <p className="shrink-0 text-right text-[15px] font-bold tabular-nums tracking-[-0.01em] text-[var(--color-ink)]">
                        kr {formatNOK(Math.round(line.lineTotalKr))}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--color-divider)] bg-[var(--color-stone)] px-5 py-5">
          <dl className="space-y-2 text-[12px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
            <div className="flex justify-between gap-4">
              <dt>{tr(locale, "Delsum (inkl. MVA)", "Subtotal (incl. VAT)")}</dt>
              <dd className="font-mono text-[14px] font-semibold normal-case tracking-normal text-[var(--color-ink)]">
                kr {formatNOK(Math.round(subtotal))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tr(locale, "Total (inkl. MVA)", "Total (incl. VAT)")}</dt>
              <dd className="font-mono text-[14px] font-bold normal-case tracking-normal text-[var(--color-ink)]">
                kr {formatNOK(Math.round(subtotal))}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              href="/handlekurv"
              onClick={() => onOpenChange(false)}
              className="btn-outline-dark flex w-full justify-center"
            >
              <ShoppingBag className="h-4 w-4" />
              {tr(locale, "Vis handlekurv", "View cart")}
            </Link>
            {checkoutDisabled ? (
              <button
                type="button"
                disabled
                className="btn-primary flex w-full cursor-not-allowed justify-center disabled:opacity-60"
              >
                {tr(locale, "Gå til kassen", "Go to checkout")}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/kasse"
                onClick={() => onOpenChange(false)}
                className="btn-primary flex w-full justify-center"
              >
                {tr(locale, "Gå til kassen", "Go to checkout")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
