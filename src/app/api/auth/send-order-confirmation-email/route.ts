import { NextResponse } from "next/server";
import { isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import { resolveEmailLocaleFromRequest } from "@/lib/email/email-locale";
import {
  buildOrderConfirmationEmailHtml,
  buildOrderConfirmationEmailText,
  getEmailBaseUrl,
  getOrderConfirmationEmailSubject,
  type OrderConfirmationEmailData,
  type OrderConfirmationLine,
} from "@/lib/email/order-confirmation-email-template";
import { sendTransactionalEmail } from "@/lib/email/send-email";

function parseLine(raw: unknown): OrderConfirmationLine | null {
  if (!raw || typeof raw !== "object") return null;
  const line = raw as Record<string, unknown>;
  const productName = typeof line.productName === "string" ? line.productName.trim() : "";
  const quantity = typeof line.quantity === "number" ? line.quantity : Number(line.quantity) || 0;
  const unitPriceKr = typeof line.unitPriceKr === "number" ? line.unitPriceKr : Number(line.unitPriceKr) || 0;
  const lineTotalKr = typeof line.lineTotalKr === "number" ? line.lineTotalKr : Number(line.lineTotalKr) || 0;
  if (!productName || quantity <= 0) return null;
  return {
    productName,
    spec: typeof line.spec === "string" ? line.spec : undefined,
    quantity,
    unitPriceKr,
    lineTotalKr,
    imageUrl: typeof line.imageUrl === "string" ? line.imageUrl : undefined,
  };
}

function parseAddress(raw: unknown): OrderConfirmationEmailData["shippingAddress"] | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const fullName = typeof a.fullName === "string" ? a.fullName.trim() : "";
  const streetLine1 = typeof a.streetLine1 === "string" ? a.streetLine1.trim() : "";
  const city = typeof a.city === "string" ? a.city.trim() : "";
  const postalCode = typeof a.postalCode === "string" ? a.postalCode.trim() : "";
  const countryCode = typeof a.countryCode === "string" ? a.countryCode.trim() : "";
  if (!fullName || !streetLine1 || !city || !postalCode || !countryCode) return null;
  return {
    fullName,
    streetLine1,
    streetLine2: typeof a.streetLine2 === "string" ? a.streetLine2 : undefined,
    city,
    postalCode,
    countryCode,
    phoneNumber: typeof a.phoneNumber === "string" ? a.phoneNumber : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const locale = resolveEmailLocaleFromRequest(request, body.locale);
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = normalizeAuthEmail(String(body.email || ""));
    const orderCode = String(body.orderCode || "").trim();
    const orderDate = String(body.orderDate || "").trim();
    const company = typeof body.company === "string" ? body.company.trim() : undefined;
    const totalWithTaxKr = typeof body.totalWithTaxKr === "number" ? body.totalWithTaxKr : Number(body.totalWithTaxKr) || 0;

    if (!firstName || !lastName) {
      return NextResponse.json({ success: false, error: "missing_name" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }
    if (!orderCode) {
      return NextResponse.json({ success: false, error: "missing_order_code" }, { status: 400 });
    }

    const shippingAddress = parseAddress(body.shippingAddress);
    if (!shippingAddress) {
      return NextResponse.json({ success: false, error: "invalid_address" }, { status: 400 });
    }

    const linesRaw = Array.isArray(body.lines) ? body.lines : [];
    const lines = linesRaw
      .map((raw: unknown) => parseLine(raw))
      .filter((line: OrderConfirmationLine | null): line is OrderConfirmationLine => line !== null);
    if (!lines.length) {
      return NextResponse.json({ success: false, error: "missing_lines" }, { status: 400 });
    }

    const data: OrderConfirmationEmailData = {
      firstName,
      lastName,
      email,
      orderCode,
      orderDate: orderDate || new Date().toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO"),
      company,
      shippingAddress,
      lines,
      totalWithTaxKr:
        totalWithTaxKr > 0
          ? totalWithTaxKr
          : lines.reduce((sum: number, line: OrderConfirmationLine) => sum + line.lineTotalKr, 0),
    };

    const baseUrl = getEmailBaseUrl(new URL(request.url).origin);
    const mail = await sendTransactionalEmail({
      to: email,
      subject: getOrderConfirmationEmailSubject(locale, orderCode),
      html: buildOrderConfirmationEmailHtml(data, baseUrl, locale),
      text: buildOrderConfirmationEmailText(data, locale),
    });

    return NextResponse.json({ success: true, emailSent: mail.sent });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
