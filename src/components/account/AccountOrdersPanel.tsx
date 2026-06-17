"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  formatOrderDate,
  formatOrderTotalSummary,
  orderStateLabel,
  orderStateTone,
} from "@/components/account/account-order-utils";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { tr } from "@/lib/locale";
import {
  cancelCustomerOrder,
  fetchOrderStatusOverlayMap,
  type OrderStatusOverlayClient,
} from "@/lib/orders/order-actions-client";
import { canCancelOrderState, resolveOrderDisplayState } from "@/lib/orders/order-status-display";
import { errorMessageFromShopResult, shopGraphql } from "@/lib/vendure/shop-client-browser";
import { GQL_CUSTOMER_ORDER_LIST } from "@/lib/vendure/shop-auth-documents";

type OrderRow = {
  id: string;
  code: string;
  state: string;
  orderPlacedAt: string | null;
  createdAt: string | null;
  currencyCode?: string | null;
  totalWithTax?: unknown;
  totalQuantity: number;
};

export function AccountOrdersPanel() {
  const lc = useActiveLocale();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [overlays, setOverlays] = useState<Record<string, OrderStatusOverlayClient>>({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await shopGraphql<{
      activeCustomer: { orders: { items: unknown[] | null } | null } | null;
    }>(GQL_CUSTOMER_ORDER_LIST, { options: { take: 100, skip: 0 } }, lc);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer || !res.data?.activeCustomer?.orders?.items) {
      setRows([]);
      setOverlays({});
      setLoading(false);
      return;
    }
    const items: OrderRow[] = [];
    for (const raw of res.data.activeCustomer.orders.items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const id = typeof o.id === "string" || typeof o.id === "number" ? String(o.id) : "";
      const code = typeof o.code === "string" ? o.code : "";
      const state = typeof o.state === "string" ? o.state : "";
      if (!id || !code) continue;
      items.push({
        id,
        code,
        state,
        orderPlacedAt: typeof o.orderPlacedAt === "string" ? o.orderPlacedAt : null,
        createdAt: typeof o.createdAt === "string" ? o.createdAt : null,
        currencyCode: typeof o.currencyCode === "string" ? o.currencyCode : "",
        totalWithTax: o.totalWithTax,
        totalQuantity:
          typeof o.totalQuantity === "number" ? o.totalQuantity : Number(o.totalQuantity) || 0,
      });
    }
    const overlayMap = await fetchOrderStatusOverlayMap(items.map((row) => row.id));
    setRows(items);
    setOverlays(overlayMap);
    setLoading(false);
  }, [lc]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    const result = await cancelCustomerOrder(orderId, lc);
    setCancellingId(null);
    if (result.success) {
      await load();
    }
  };

  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
      <h2 className="text-[18px] font-bold">{tr(lc, "Bestillinger", "Orders")}</h2>
      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--color-muted)]">{tr(lc, "Laster …", "Loading …")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-[14px] text-[var(--color-muted)]">
          {tr(lc, "Ingen ordrer funnet ennå.", "No orders yet.")}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-divider)] bg-[var(--color-stone)]/50">
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Ordrenummer", "Order number")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Dato", "Date")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Status", "Status")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Total", "Total")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Handlinger", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const displayState = resolveOrderDisplayState(row.state, overlays[row.id]);
                const showCancel = canCancelOrderState(displayState);
                return (
                  <tr key={row.id} className="border-b border-[var(--color-divider)] last:border-b-0">
                    <td className="px-3 py-4 font-mono text-[14px] font-bold text-[var(--color-ink)]">
                      #{row.code}
                    </td>
                    <td className="px-3 py-4 text-[14px] text-[var(--color-muted)]">
                      {formatOrderDate(row.orderPlacedAt ?? row.createdAt, lc)}
                    </td>
                    <td className={`px-3 py-4 text-[14px] font-medium ${orderStateTone(displayState)}`}>
                      {orderStateLabel(displayState, lc)}
                    </td>
                    <td className="px-3 py-4 text-[14px] text-[var(--color-muted)]">
                      {formatOrderTotalSummary(lc, row.totalWithTax, row.totalQuantity)}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/konto/ordrer/${encodeURIComponent(row.id)}`}
                          className="inline-flex rounded-[3px] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] btn-primary"
                        >
                          {tr(lc, "Vis", "View")}
                        </Link>
                        {showCancel ? (
                          <button
                            type="button"
                            onClick={() => void handleCancel(row.id)}
                            disabled={cancellingId === row.id}
                            className="inline-flex rounded-[3px] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            {cancellingId === row.id
                              ? tr(lc, "Kansellerer …", "Cancelling …")
                              : tr(lc, "Kanseller", "Cancel")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
