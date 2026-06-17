import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import {
  buildOrderConfirmationEmailHtml,
  buildOrderConfirmationEmailText,
  type OrderConfirmationEmailData,
} from "@/lib/email/order-confirmation-email-template";
import { buildTecnoXEmailShell, escapeHtml, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export type OrderCancelledEmailData = OrderConfirmationEmailData;

export function getOrderCancelledEmailSubject(locale: Locale, orderCode: string): string {
  return tr(locale, `Ordre kansellert #${orderCode}`, `Order cancelled #${orderCode}`);
}

function cancelledBodyIntro(locale: Locale, fullName: string): string {
  return `
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Ordre", "Order")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "kansellert", "cancelled")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Hei", "Dear")} ${escapeHtml(fullName)},</strong>
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Ordren din er kansellert som forespurt. Du finner detaljene nedenfor.",
                  "Your order has been cancelled as requested. The details are below.",
                )}
              </p>`;
}

export function buildOrderCancelledEmailHtml(
  data: OrderCancelledEmailData,
  baseUrl: string,
  locale: Locale,
): string {
  const confirmationHtml = buildOrderConfirmationEmailHtml(data, baseUrl, locale);
  const fullName = escapeHtml(`${data.firstName} ${data.lastName}`.trim());
  const intro = cancelledBodyIntro(locale, fullName);

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
    getOrderCancelledEmailSubject(locale, data.orderCode),
    `<tr><td style="padding:36px 32px 28px;background-color:#ffffff;">${inner}</td></tr>`,
  );
}

export function buildOrderCancelledEmailText(data: OrderCancelledEmailData, locale: Locale): string {
  const base = buildOrderConfirmationEmailText(data, locale);
  return `${tr(locale, "Ordren din er kansellert.", "Your order has been cancelled.")}\n\n${base}`;
}

export { getEmailBaseUrl } from "@/lib/email/tecno-x-email-shell";
