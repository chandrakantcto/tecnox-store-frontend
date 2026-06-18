import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { buildTecnoXEmailShell, escapeHtml, getEmailBaseUrl, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export interface ContactEnquiryEmailData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}

export function getContactEnquiryAdminSubject(locale: Locale): string {
  return tr(locale, "Ny kontakthenvendelse", "New Contact Enquiry");
}

export function getContactEnquiryUserSubject(locale: Locale): string {
  return tr(locale, "Vi har mottatt din henvendelse", "We have received your enquiry");
}

export function buildContactEnquiryAdminHtml(data: ContactEnquiryEmailData, baseUrl: string, locale: Locale): string {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = data.phone ? escapeHtml(data.phone) : "";
  const company = data.company ? escapeHtml(data.company) : "";
  const message = escapeHtml(data.message).replace(/\n/g, '<br />');

  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Ny", "New")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "kontakthenvendelse", "contact enquiry")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "En ny kontakthenvendelse har blitt sendt inn av", "A new contact enquiry has been submitted by")} ${name}.</strong>
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Melding", "Message")}:</strong><br/>
                ${message}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:#fafafa;border:1px solid #ececec;border-radius:6px;">
                <tr>
                  <td style="padding:16px 18px;font-size:14px;line-height:2;color:#333333;">
                    <strong>${tr(locale, "Navn", "Name")}:</strong> ${name}<br />
                    <strong>${tr(locale, "E-post", "Email")}:</strong> <a href="mailto:${email}" style="color:${BRAND_BLUE};text-decoration:none;">${email}</a><br />
                    ${phone ? `<strong>${tr(locale, "Telefon", "Phone")}:</strong> ${phone}<br />` : ""}
                    ${company ? `<strong>${tr(locale, "Selskap", "Company")}:</strong> ${company}<br />` : ""}
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">
                <strong style="color:${BRAND_BLUE};">${tr(locale, "Systemvarsel", "System Notification")}</strong>
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getContactEnquiryAdminSubject(locale), bodyHtml);
}

export function buildContactEnquiryUserHtml(data: ContactEnquiryEmailData, baseUrl: string, locale: Locale): string {
  const name = escapeHtml(data.name);
  const message = escapeHtml(data.message).replace(/\n/g, '<br />');

  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Henvendelse", "Enquiry")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "Mottatt", "Received")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Hei", "Dear")} ${name},</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Takk for at du kontakter oss. Vårt team har mottatt din henvendelse og vil komme tilbake til deg så snart som mulig.",
                  "Thank you for contacting us. Our team has received your enquiry and will get back to you as soon as possible."
                )}
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Din melding", "Your Message")}:</strong><br/>
                ${message}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(locale, "Vennlig hilsen,", "Warm regards,")}<br />
                <strong style="color:${BRAND_BLUE};">${tr(locale, "Tecno X-teamet", "The Tecno X Team")}</strong>
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getContactEnquiryUserSubject(locale), bodyHtml);
}
