import { NextResponse } from "next/server";
import { getShopAuthTokenFromRequest } from "@/lib/auth/shop-request-auth";
import { getOrderStatusOverlayMap } from "@/lib/orders/order-status-overlay";

export async function POST(request: Request) {
  try {
    const authToken = getShopAuthTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderIds = Array.isArray(body.orderIds)
      ? body.orderIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    const overlays = await getOrderStatusOverlayMap(orderIds);
    return NextResponse.json({ success: true, overlays });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
