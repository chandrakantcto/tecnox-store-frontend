import { NextResponse } from "next/server";
import { getShopAuthTokenFromRequest, verifyShopOrderForCustomer } from "@/lib/auth/shop-request-auth";
import { resolveEmailLocaleFromRequest } from "@/lib/email/email-locale";
import {
  buildOrderCancelledEmailHtml,
  buildOrderCancelledEmailText,
  getOrderCancelledEmailSubject,
  getEmailBaseUrl,
} from "@/lib/email/order-cancelled-email-template";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { buildOrderConfirmationEmailData } from "@/lib/orders/build-order-email-data";
import { canCancelOrderState, resolveOrderDisplayState } from "@/lib/orders/order-status-display";
import { markOrderCancelledOverlay, getOrderStatusOverlayMap } from "@/lib/orders/order-status-overlay";

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
    if (!canCancelOrderState(displayState)) {
      return NextResponse.json({ success: false, error: "not_cancellable" }, { status: 400 });
    }

    await markOrderCancelledOverlay({
      orderId: order.id,
      customerId: customer.id,
      orderCode: order.code,
      originalState: order.state,
    });

    const emailData = buildOrderConfirmationEmailData(customer, order, locale);
    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);

    await sendTransactionalEmail({
      to: customer.emailAddress,
      subject: getOrderCancelledEmailSubject(locale, order.code),
      html: buildOrderCancelledEmailHtml(emailData, baseUrl, locale),
      text: buildOrderCancelledEmailText(emailData, locale),
    });

    return NextResponse.json({ success: true, state: "Cancelled" });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
