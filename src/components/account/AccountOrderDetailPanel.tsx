"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StorefrontRemoteImage } from "@/components/site/StorefrontRemoteImage";
import {
  formatOrderDate,
  orderStateLabel,
  orderStateTone,
} from "@/components/account/account-order-utils";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { tr, type Locale } from "@/lib/locale";
import { canCancelOrderState, resolveOrderDisplayState } from "@/lib/orders/order-status-display";
import {
  cancelCustomerOrder,
  fetchOrderStatusOverlayMap,
  reorderCustomerOrder,
  type OrderStatusOverlayClient,
} from "@/lib/orders/order-actions-client";
import { errorMessageFromShopResult, shopGraphql } from "@/lib/vendure/shop-client-browser";
import { GQL_ORDER_DETAIL } from "@/lib/vendure/shop-auth-documents";
import { absoluteAssetUrl } from "@/lib/vendure/normalize";
import { formatMoneyMinorKr } from "@/lib/vendure/money-display";

function ShippingBlock({ title, addr }: { title: string; addr: unknown }) {
  if (!addr || typeof addr !== "object") return null;
  const a = addr as Record<string, unknown>;
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">{title}</p>
      <address className="mt-3 whitespace-pre-line not-italic text-[14px] leading-relaxed">
        {typeof a.fullName === "string" ? `${a.fullName}\n` : null}
        {typeof a.streetLine1 === "string" ? `${a.streetLine1}\n` : null}
        {typeof a.postalCode === "string" || typeof a.city === "string"
          ? `${String(a.postalCode ?? "").trim()} ${String(a.city ?? "").trim()}`.trim() + "\n"
          : null}
        {typeof a.countryCode === "string" ? `${a.countryCode}\n` : null}
        {typeof a.phoneNumber === "string" ? a.phoneNumber : null}
      </address>
    </div>
  );
}

function lineUnitPriceKr(line: Record<string, unknown>): string {
  const unit =
    line.discountedUnitPriceWithTax ??
    line.unitPriceWithTax ??
    (typeof line.quantity === "number" && line.quantity > 0
      ? (() => {
          const total = line.discountedLinePriceWithTax ?? line.linePriceWithTax;
          if (typeof total === "number" || typeof total === "string") {
            const n = Number(total);
            if (Number.isFinite(n)) return Math.round(n / line.quantity);
          }
          return null;
        })()
      : null);
  return formatMoneyMinorKr(unit);
}

function OrderLinesPreview({ lines, locale }: { lines: unknown[] | undefined | null; locale: Locale }) {
  if (!Array.isArray(lines) || !lines.length) return null;
  return (
    <div className="mt-6 border-t border-[var(--color-divider)] pt-6">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
        {tr(locale, "Linjer", "Lines")}
      </h3>
      <ul className="mt-4 divide-y divide-[var(--color-divider)]">
        {lines.map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const line = raw as Record<string, unknown>;
          const pv =
            line.productVariant && typeof line.productVariant === "object"
              ? (line.productVariant as Record<string, unknown>)
              : null;
          const prod =
            pv?.product && typeof pv.product === "object" ? (pv.product as Record<string, unknown>) : null;
          const name =
            typeof prod?.name === "string"
              ? prod.name
              : typeof pv?.name === "string"
                ? pv.name
                : tr(locale, "Vare", "Item");
          const slug = typeof prod?.slug === "string" ? prod.slug : "";
          const qty = typeof line.quantity === "number" ? line.quantity : 0;
          const preview =
            pv?.featuredAsset && typeof pv.featuredAsset === "object"
              ? String((pv.featuredAsset as Record<string, unknown>).preview ?? "")
              : "";
          const img = preview ? absoluteAssetUrl(preview) : "";
          const lineKr = formatMoneyMinorKr(line.discountedLinePriceWithTax ?? line.linePriceWithTax);
          const unitKr = lineUnitPriceKr(line);

          const inner = (
            <div className="flex items-start gap-4 py-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[2px] bg-[var(--color-stone)]">
                <StorefrontRemoteImage
                  src={img}
                  alt=""
                  locale={locale}
                  fill
                  compact
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-ink)]">{name}</p>
                <p className="text-[13px] text-[var(--color-muted)]">
                  {qty} × kr {unitKr}
                </p>
              </div>
              <p className="font-mono whitespace-nowrap text-[var(--color-ink)]">kr {lineKr}</p>
            </div>
          );

          return (
            <li key={typeof line.id === "string" || typeof line.id === "number" ? String(line.id) : slug + qty}>
              {slug ? (
                <Link
                  href={`/produkter/${encodeURIComponent(slug)}`}
                  className="block hover:bg-[var(--color-stone)]/40"
                >
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AccountOrderDetailPanel() {
  const params = useParams();
  const rawId = params?.orderId;
  const orderId = typeof rawId === "string" ? decodeURIComponent(rawId) : "";
  const lc = useActiveLocale();
  const [data, setData] = useState<unknown>(null);
  const [overlay, setOverlay] = useState<OrderStatusOverlayClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await shopGraphql<{ order: unknown }>(GQL_ORDER_DETAIL, { id: orderId }, lc);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer || !res.data?.order) {
      setErr(outer ?? tr(lc, "Ordre ikke tilgjengelig.", "Order not available."));
      setData(null);
      setOverlay(null);
    } else {
      setErr(null);
      setData(res.data.order);
      const overlays = await fetchOrderStatusOverlayMap([orderId]);
      setOverlay(overlays[orderId] ?? null);
    }
    setLoading(false);
  }, [orderId, lc]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = async () => {
    if (!orderId) return;
    setActionBusy(true);
    setActionError(null);
    setActionMessage(null);
    const result = await cancelCustomerOrder(orderId, lc);
    setActionBusy(false);
    if (!result.success) {
      setActionError(tr(lc, "Kunne ikke kansellere ordren.", "Could not cancel the order."));
      return;
    }
    setActionMessage(tr(lc, "Ordren er kansellert.", "Order cancelled."));
    await load();
  };

  const handleReorder = async () => {
    if (!orderId) return;
    setActionBusy(true);
    setActionError(null);
    setActionMessage(null);
    const result = await reorderCustomerOrder(orderId, lc);
    setActionBusy(false);
    if (!result.success) {
      setActionError(tr(lc, "Kunne ikke bestille på nytt.", "Could not reorder."));
      return;
    }
    setActionMessage(tr(lc, "Ordren er aktiv igjen.", "Order is active again."));
    await load();
  };

  if (!orderId) return <p>{tr(lc, "Ugyldig ordre.", "Invalid order.")}</p>;
  if (loading) return <p className="text-[var(--color-muted)]">{tr(lc, "Laster …", "Loading …")}</p>;
  if (err || !data || typeof data !== "object") {
    return (
      <p className="text-red-800">
        {err ?? tr(lc, "Fant ikke ordren.", "Order not found.")}
      </p>
    );
  }

  const o = data as Record<string, unknown>;
  const orderCode = typeof o.code === "string" ? o.code : "";
  const vendureState = typeof o.state === "string" ? o.state : "";
  const displayState = resolveOrderDisplayState(vendureState, overlay);
  const isCancelled = displayState === "Cancelled";
  const showCancel = canCancelOrderState(displayState);
  const orderDate = formatOrderDate(
    (typeof o.orderPlacedAt === "string" ? o.orderPlacedAt : null) ??
      (typeof o.createdAt === "string" ? o.createdAt : null),
    lc,
  );

  return (
    <div className="space-y-8">
      {actionMessage ? (
        <p className="rounded-[3px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
          {actionMessage}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-[3px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {actionError}
        </p>
      ) : null}

      <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8">
        <p className="font-mono text-[20px] font-bold text-[var(--color-ink)] sm:text-[22px]">{orderCode}</p>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border border-[var(--color-divider)] bg-[var(--color-stone)]/25 px-4 py-4 sm:px-5">
          <div>
            <p className={`text-[14px] font-semibold ${orderStateTone(displayState)}`}>
              {orderStateLabel(displayState, lc)}
            </p>
            {orderDate !== "—" ? (
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">{orderDate}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="text-left sm:text-right">
              <p className="text-[12px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                {tr(lc, "Total m/MVA", "Total inc. VAT")}
              </p>
              <p className="mt-1 font-mono text-[18px] font-bold text-[var(--color-ink)]">
                kr {formatMoneyMinorKr(o.totalWithTax)}
              </p>
            </div>
            {showCancel ? (
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={actionBusy}
                className="inline-flex rounded-[3px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {actionBusy ? tr(lc, "Kansellerer …", "Cancelling …") : tr(lc, "Kanseller", "Cancel")}
              </button>
            ) : null}
            {isCancelled ? (
              <button
                type="button"
                onClick={() => void handleReorder()}
                disabled={actionBusy}
                className="inline-flex rounded-[3px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] btn-primary disabled:opacity-60"
              >
                {actionBusy ? tr(lc, "Bestiller …", "Reordering …") : tr(lc, "Bestill på nytt", "Reorder")}
              </button>
            ) : null}
          </div>
        </div>

        <OrderLinesPreview lines={o.lines as unknown[]} locale={lc} />

        <div className="mt-8 grid gap-6 border-t border-[var(--color-divider)] pt-8 sm:grid-cols-2 sm:gap-8">
          <ShippingBlock title={tr(lc, "Leveranse", "Shipping")} addr={o.shippingAddress} />
          <ShippingBlock title={tr(lc, "Faktura", "Billing")} addr={o.billingAddress} />
        </div>
      </div>
      <Link
        href="/konto/ordrer"
        className="inline-block text-[14px] text-[var(--color-copper)] underline-offset-2 hover:underline"
      >
        ← {tr(lc, "Tilbake til ordrer", "Back to orders")}
      </Link>
    </div>
  );
}
