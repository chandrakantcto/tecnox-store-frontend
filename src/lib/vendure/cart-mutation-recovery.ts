import {
  errorMessageFromShopResult,
  shopGraphql,
} from "@/lib/vendure/shop-client-browser";
import {
  GQL_ACTIVE_ORDER_CHECKOUT_SNAPSHOT,
  GQL_TRANSITION_ORDER_STATE,
} from "@/lib/vendure/shop-order-documents";

function pickMutationPayload(data: unknown, key: string): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const v = (data as Record<string, unknown>)[key];
  if (!v || typeof v !== "object") return null;
  return v as Record<string, unknown>;
}

export function isOrderModificationBlockedPayload(payload: Record<string, unknown> | null | undefined): boolean {
  if (!payload) return false;
  const tn = typeof payload.__typename === "string" ? payload.__typename : "";
  const code = typeof payload.errorCode === "string" ? payload.errorCode.trim() : "";
  return tn === "OrderModificationError" || code === "ORDER_MODIFICATION_ERROR";
}

/**
 * Lines may only change in `Draft` or `AddingItems`. After `/kasse` the order stays in e.g.
 * `ArrangingPayment`; transition back before remove/adjust succeeds.
 */
export async function transitionActiveOrderToAddingItemsForCart(locale: string): Promise<boolean> {
  const snap = await shopGraphql<{ activeOrder: { state?: unknown } | null | undefined }>(
    GQL_ACTIVE_ORDER_CHECKOUT_SNAPSHOT,
    undefined,
    locale,
  );
  if (snap.networkError || snap.graphqlErrors.length) return false;
  const o = snap.data?.activeOrder;
  const stateRaw = o && typeof o === "object" && typeof (o as { state?: unknown }).state === "string" ? (o as { state: string }).state.trim() : "";
  if (!stateRaw) return false;
  if (stateRaw === "AddingItems" || stateRaw === "Draft") return true;

  const tr = await shopGraphql<{ transitionOrderToState: unknown }>(
    GQL_TRANSITION_ORDER_STATE,
    { state: "AddingItems" },
    locale,
  );
  if (tr.networkError || tr.graphqlErrors.length) return false;
  const p = pickMutationPayload(tr.data, "transitionOrderToState");
  if (!p) return false;
  const tn = typeof p.__typename === "string" ? p.__typename : "";
  if (tn === "Order") return true;
  if (tn === "OrderStateTransitionError") {
    const recover = await shopGraphql<{ activeOrder: { state?: unknown } | null | undefined }>(
      GQL_ACTIVE_ORDER_CHECKOUT_SNAPSHOT,
      undefined,
      locale,
    );
    const o2 = recover.data?.activeOrder;
    const st =
      o2 && typeof o2 === "object" && typeof (o2 as { state?: unknown }).state === "string"
        ? (o2 as { state: string }).state.trim()
        : "";
    return st === "AddingItems" || st === "Draft";
  }
  return false;
}

type CartMutateResult = {
  networkError: string | null;
  graphqlErrors: string[];
  payload: Record<string, unknown> | null;
};

/**
 * Runs a cart mutation; on `OrderModificationError`, tries `ArrangingPayment` → `AddingItems`, then retries once.
 */
export async function runCartMutationWithAddingItemsRecovery(
  locale: string,
  mutate: () => Promise<CartMutateResult>,
): Promise<CartMutateResult> {
  let r = await mutate();
  const outer = errorMessageFromShopResult(r.networkError, r.graphqlErrors);
  if (outer) return r;

  if (isOrderModificationBlockedPayload(r.payload)) {
    const moved = await transitionActiveOrderToAddingItemsForCart(locale);
    if (moved) {
      r = await mutate();
    }
  }
  return r;
}
