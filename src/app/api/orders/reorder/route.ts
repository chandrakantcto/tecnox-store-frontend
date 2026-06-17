import { NextResponse } from "next/server";
import { getShopAuthTokenFromRequest, verifyShopOrderForCustomer } from "@/lib/auth/shop-request-auth";
import { resolveEmailLocaleFromRequest } from "@/lib/email/email-locale";
import {
  buildOrderReorderEmailHtml,
  buildOrderReorderEmailText,
  getOrderReorderEmailSubject,
  getEmailBaseUrl,
} from "@/lib/email/order-reorder-email-template";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { buildOrderConfirmationEmailData } from "@/lib/orders/build-order-email-data";
import { resolveOrderDisplayState } from "@/lib/orders/order-status-display";
import { getOrderStatusOverlayMap, reactivateOrderOverlay } from "@/lib/orders/order-status-overlay";

export async function POST(request: Request) {
  try {
    const authToken = getShopAuthTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderId = String(body.orderId || "").trim();
    const locale = resolveEmailLocaleFromRequest(request, body.locale);

    if (!orderId) {
      return NextResponse.json({ success: false, error: "missing_order_id" }, { status: 400 });
    }

    const { customer, order } = await verifyShopOrderForCustomer(authToken, orderId, locale);
    if (!customer || !order) {
      return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
    }

    const overlayMap = await getOrderStatusOverlayMap([orderId]);
    const displayState = resolveOrderDisplayState(order.state, overlayMap[orderId]);
    if (displayState !== "Cancelled") {
      return NextResponse.json({ success: false, error: "not_cancelled" }, { status: 400 });
    }

    const originalState =
      overlayMap[orderId]?.originalState && overlayMap[orderId].originalState !== "Cancelled"
        ? overlayMap[orderId].originalState
        : "ArrangingPayment";

    await reactivateOrderOverlay({
      orderId: order.id,
      customerId: customer.id,
      orderCode: order.code,
      originalState,
    });

    const emailData = buildOrderConfirmationEmailData(customer, order, locale);
    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);

    await sendTransactionalEmail({
      to: customer.emailAddress,
      subject: getOrderReorderEmailSubject(locale, order.code),
      html: buildOrderReorderEmailHtml(emailData, baseUrl, locale),
      text: buildOrderReorderEmailText(emailData, locale),
    });

    return NextResponse.json({ success: true, state: originalState });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
