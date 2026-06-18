import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { buildTecnoXEmailShell, escapeHtml, getEmailBaseUrl, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export interface NewsletterSubscribeEmailData {
  email: string;
}

export function getNewsletterSubscribeAdminSubject(locale: Locale): string {
  return tr(locale, "Ny nyhetsbrev-abonnent", "New Newsletter Subscriber");
}

export function getNewsletterSubscribeUserSubject(locale: Locale): string {
  return tr(locale, "Velkommen til nyhetsbrevet vårt", "Welcome to our newsletter");
}

export function buildNewsletterSubscribeAdminHtml(data: NewsletterSubscribeEmailData, baseUrl: string, locale: Locale): string {
  const email = escapeHtml(data.email);

  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Ny", "New")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "abonnent", "subscriber")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "En ny bruker har meldt seg på nyhetsbrevet.", "A new user has subscribed to the newsletter.")}</strong>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:#fafafa;border:1px solid #ececec;border-radius:6px;">
                <tr>
                  <td style="padding:16px 18px;font-size:14px;line-height:2;color:#333333;">
                    <strong>${tr(locale, "E-post", "Email")}:</strong> <a href="mailto:${email}" style="color:${BRAND_BLUE};text-decoration:none;">${email}</a><br />
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">
                <strong style="color:${BRAND_BLUE};">${tr(locale, "Systemvarsel", "System Notification")}</strong>
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getNewsletterSubscribeAdminSubject(locale), bodyHtml);
}

export function buildNewsletterSubscribeUserHtml(baseUrl: string, locale: Locale): string {
  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Abonnement", "Subscription")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "Bekreftet", "Confirmed")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Velkommen!", "Welcome!")}</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Takk for at du abonnerer på vårt nyhetsbrev. Du står nå på listen vår og vil motta produktoppdateringer, bransjenyheter og eksklusive tilbud rett i innboksen din.",
                  "Thank you for subscribing to our newsletter. You are now on our list and will receive product updates, industry news, and exclusive offers straight to your inbox."
                )}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(locale, "Vennlig hilsen,", "Warm regards,")}<br />
                <strong style="color:${BRAND_BLUE};">${tr(locale, "Tecno X-teamet", "The Tecno X Team")}</strong>
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getNewsletterSubscribeUserSubject(locale), bodyHtml);
}
