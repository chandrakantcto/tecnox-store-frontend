import { getStoredShopAuthToken } from "@/lib/vendure/shop-client-browser";

function authHeaders(): Record<string, string> {
  const token = getStoredShopAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["vendure-auth-token"] = token;
  }
  return headers;
}

export type OrderStatusOverlayClient = {
  orderId: string;
  orderCode: string;
  originalState: string;
  reactivated: boolean;
};

export async function fetchOrderStatusOverlayMap(orderIds: string[]): Promise<Record<string, OrderStatusOverlayClient>> {
  if (!orderIds.length) return {};
  try {
    const res = await fetch("/api/orders/status-overlay", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ orderIds }),
    });
    const data = (await res.json()) as { success?: boolean; overlays?: Record<string, OrderStatusOverlayClient> };
    return data.success ? (data.overlays ?? {}) : {};
  } catch {
    return {};
  }
}

export async function cancelCustomerOrder(orderId: string, locale: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ orderId, locale }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    return data.success ? { success: true } : { success: false, error: data.error ?? "cancel_failed" };
  } catch {
    return { success: false, error: "network_error" };
  }
}

export async function reorderCustomerOrder(orderId: string, locale: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/orders/reorder", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ orderId, locale }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    return data.success ? { success: true } : { success: false, error: data.error ?? "reorder_failed" };
  } catch {
    return { success: false, error: "network_error" };
  }
}
