import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import {
  buildOrderConfirmationEmailHtml,
  buildOrderConfirmationEmailText,
  type OrderConfirmationEmailData,
} from "@/lib/email/order-confirmation-email-template";
import { buildTecnoXEmailShell, escapeHtml, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export type OrderReorderEmailData = OrderConfirmationEmailData;

export function getOrderReorderEmailSubject(locale: Locale, orderCode: string): string {
  return tr(locale, `Ordre gjenåpnet #${orderCode}`, `Order reactivated #${orderCode}`);
}

function reorderBodyIntro(locale: Locale, fullName: string, orderCode: string): string {
  const safeCode = escapeHtml(orderCode);
  return `
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Ordre", "Order")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "bekreftet", "confirmed")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Hei", "Dear")} ${escapeHtml(fullName)},</strong>
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  `Takk for at du bestilte på nytt! Ordren ${safeCode} er aktiv igjen og vi behandler den som vanlig.`,
                  `Thank you for reordering! Order ${safeCode} is active again and we will process it as usual.`,
                )}
              </p>`;
}

export function buildOrderReorderEmailHtml(
  data: OrderReorderEmailData,
  baseUrl: string,
  locale: Locale,
): string {
  const confirmationHtml = buildOrderConfirmationEmailHtml(data, baseUrl, locale);
  const fullName = escapeHtml(`${data.firstName} ${data.lastName}`.trim());
  const intro = reorderBodyIntro(locale, fullName, data.orderCode);

  const bodyMatch = confirmationHtml.match(
    /<tr>\s*<td style="padding:36px 32px 28px;background-color:#ffffff;">([\s\S]*?)<\/td>\s*<\/tr>/,
  );
  if (!bodyMatch) return confirmationHtml;

  const inner = bodyMatch[1].replace(
    /<h1[\s\S]*?<\/p>\s*<p style="margin:0 0 20px[^"]*">[\s\S]*?<\/p>/,
    intro,
  );

  return buildTecnoXEmailShell(
    locale,
    baseUrl,
    getOrderReorderEmailSubject(locale, data.orderCode),
    `<tr><td style="padding:36px 32px 28px;background-color:#ffffff;">${inner}</td></tr>`,
  );
}

export function buildOrderReorderEmailText(data: OrderReorderEmailData, locale: Locale): string {
  const base = buildOrderConfirmationEmailText(data, locale);
  return `${tr(
    locale,
    `Ordren ${data.orderCode} er aktiv igjen.`,
    `Order ${data.orderCode} is active again.`,
  )}\n\n${base}`;
}

export { getEmailBaseUrl } from "@/lib/email/tecno-x-email-shell";
