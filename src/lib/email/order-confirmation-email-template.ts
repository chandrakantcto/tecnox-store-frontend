import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { buildTecnoXEmailShell, escapeHtml, getEmailBaseUrl, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export type OrderConfirmationLine = {
  productName: string;
  spec?: string;
  quantity: number;
  unitPriceKr: number;
  lineTotalKr: number;
  imageUrl?: string;
};

export type OrderConfirmationEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  orderCode: string;
  orderDate: string;
  company?: string;
  shippingAddress: {
    fullName: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phoneNumber?: string;
  };
  lines: OrderConfirmationLine[];
  totalWithTaxKr: number;
};

function formatKr(n: number): string {
  return `kr ${new Intl.NumberFormat("nb-NO").format(Math.round(n))},-`;
}

export function getOrderConfirmationEmailSubject(locale: Locale, orderCode: string): string {
  return tr(locale, `Ordrebekreftelse #${orderCode}`, `Order confirmation #${orderCode}`);
}

function lineRowsHtml(lines: OrderConfirmationLine[], locale: Locale): string {
  return lines
    .map((line, index) => {
      const name = escapeHtml(line.productName);
      const spec = line.spec ? escapeHtml(line.spec) : "";
      const img = line.imageUrl
        ? `<img src="${escapeHtml(line.imageUrl)}" alt="" width="48" height="48" style="display:block;width:48px;height:48px;object-fit:cover;border-radius:2px;border:0;" />`
        : `<span style="display:inline-block;width:48px;height:48px;background:#f0f0f0;border-radius:2px;"></span>`;

      return `
                <tr>
                  <td style="padding:12px 8px;border-bottom:1px solid #ececec;font-size:13px;color:#333333;vertical-align:top;">${index + 1}</td>
                  <td style="padding:12px 8px;border-bottom:1px solid #ececec;vertical-align:top;">${img}</td>
                  <td style="padding:12px 8px;border-bottom:1px solid #ececec;font-size:13px;color:#333333;vertical-align:top;">
                    <strong>${name}</strong>${spec ? `<br /><span style="color:#666666;font-size:12px;">${spec}</span>` : ""}
                  </td>
                  <td style="padding:12px 8px;border-bottom:1px solid #ececec;font-size:13px;color:#333333;vertical-align:top;white-space:nowrap;">${formatKr(line.unitPriceKr)}</td>
                  <td style="padding:12px 8px;border-bottom:1px solid #ececec;font-size:13px;color:#333333;vertical-align:top;text-align:center;">${line.quantity}</td>
                  <td style="padding:12px 8px;border-bottom:1px solid #ececec;font-size:13px;color:#333333;vertical-align:top;white-space:nowrap;">${formatKr(line.lineTotalKr)}</td>
                </tr>`;
    })
    .join("");
}

export function buildOrderConfirmationEmailHtml(
  data: OrderConfirmationEmailData,
  baseUrl: string,
  locale: Locale,
): string {
  const fullName = escapeHtml(`${data.firstName} ${data.lastName}`.trim());
  const orderCode = escapeHtml(data.orderCode);
  const orderDate = escapeHtml(data.orderDate);
  const company = data.company?.trim() ? escapeHtml(data.company.trim()) : "";
  const addr = data.shippingAddress;
  const addressHtml = [
    escapeHtml(addr.fullName),
    escapeHtml(addr.streetLine1),
    addr.streetLine2 ? escapeHtml(addr.streetLine2) : "",
    escapeHtml(`${addr.postalCode} ${addr.city}`.trim()),
    escapeHtml(addr.countryCode),
    addr.phoneNumber ? escapeHtml(addr.phoneNumber) : "",
  ]
    .filter(Boolean)
    .join("<br />");

  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Ordre", "Order")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "bekreftet", "confirmed")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Hei", "Dear")} ${fullName},</strong>
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Takk for bestillingen! Vi har mottatt ordren din og behandler den så snart som mulig.",
                  "Thank you for your order! We have received your order and will process it promptly.",
                )}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:#fafafa;border:1px solid #ececec;border-radius:6px;">
                <tr>
                  <td style="padding:16px 18px;font-size:14px;line-height:2;color:#333333;">
                    <strong>${tr(locale, "Ordrenummer", "Order number")}:</strong> ${orderCode}<br />
                    <strong>${tr(locale, "Ordredato", "Order date")}:</strong> ${orderDate}<br />
                    <strong>${tr(locale, "Mottaker", "Recipient")}:</strong> ${fullName}<br />
                    ${company ? `<strong>${tr(locale, "Firma", "Company")}:</strong> ${company}<br />` : ""}
                    <strong>${tr(locale, "Leveringsadresse", "Delivery address")}:</strong><br />${addressHtml}
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:${BRAND_BLUE};color:#ffffff;">
                    <th style="padding:10px 8px;font-size:11px;text-align:left;font-weight:700;">${tr(locale, "Nr.", "No.")}</th>
                    <th style="padding:10px 8px;font-size:11px;text-align:left;font-weight:700;">${tr(locale, "Produkt", "Product")}</th>
                    <th style="padding:10px 8px;font-size:11px;text-align:left;font-weight:700;">${tr(locale, "Vare", "Item")}</th>
                    <th style="padding:10px 8px;font-size:11px;text-align:left;font-weight:700;">${tr(locale, "Pris", "Price")}</th>
                    <th style="padding:10px 8px;font-size:11px;text-align:center;font-weight:700;">${tr(locale, "Ant.", "Qty")}</th>
                    <th style="padding:10px 8px;font-size:11px;text-align:left;font-weight:700;">${tr(locale, "Beløp", "Amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineRowsHtml(data.lines, locale)}
                  <tr style="background-color:#e8f4fc;">
                    <td colspan="5" style="padding:14px 8px;font-size:14px;font-weight:700;color:#111111;text-align:right;">
                      ${tr(locale, "Total inkl. MVA:", "Total incl. VAT:")}
                    </td>
                    <td style="padding:14px 8px;font-size:14px;font-weight:700;color:${BRAND_BLUE};white-space:nowrap;">
                      ${formatKr(data.totalWithTaxKr)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#666666;">
                ${tr(
                  locale,
                  "Alle priser inkluderer MVA. Vi tar kontakt dersom vi trenger mer informasjon.",
                  "All prices include VAT. Our team will contact you if we need more information.",
                )}
              </p>
              <p style="margin:20px 0 0;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(locale, "Vennlig hilsen,", "Warm regards,")}<br />
                <strong style="color:${BRAND_BLUE};">${tr(locale, "Tecno X-teamet", "The Tecno X Team")}</strong>
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getOrderConfirmationEmailSubject(locale, data.orderCode), bodyHtml);
}

export function buildOrderConfirmationEmailText(data: OrderConfirmationEmailData, locale: Locale): string {
  const addr = data.shippingAddress;
  const lines = data.lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.productName}${l.spec ? ` (${l.spec})` : ""} — ${l.quantity} × ${formatKr(l.unitPriceKr)} = ${formatKr(l.lineTotalKr)}`,
    )
    .join("\n");

  return `${tr(locale, "Hei", "Dear")} ${data.firstName} ${data.lastName},

${tr(locale, "Takk for bestillingen!", "Thank you for your order!")}

${tr(locale, "Ordrenummer", "Order number")}: ${data.orderCode}
${tr(locale, "Ordredato", "Order date")}: ${data.orderDate}

${lines}

${tr(locale, "Total inkl. MVA", "Total incl. VAT")}: ${formatKr(data.totalWithTaxKr)}

Tecno X`;
}

export { getEmailBaseUrl };
