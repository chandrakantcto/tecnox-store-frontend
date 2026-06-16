import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { buildTecnoXEmailShell, escapeHtml, getEmailBaseUrl, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export interface RegistrationEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

export function getRegistrationEmailSubject(locale: Locale): string {
  return tr(locale, "Velkommen til Tecno X", "Welcome to Tecno X");
}

export function buildRegistrationEmailHtml(data: RegistrationEmailData, baseUrl: string, locale: Locale): string {
  const firstName = escapeHtml(data.firstName);
  const lastName = escapeHtml(data.lastName);
  const email = escapeHtml(data.email);
  const fullName = `${firstName} ${lastName}`.trim();

  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Velkommen til", "Welcome to")}<span style="color:${BRAND_BLUE};padding:0 4px;"> Tecno X</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Hei", "Dear")} ${fullName},</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Takk for at du registrerte deg hos Tecno X. Kontoen din er opprettet.",
                  "Thank you for registering at Tecno X. Your account has been created successfully.",
                )}
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Kontodetaljer", "Account details")}</strong>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:#fafafa;border:1px solid #ececec;border-radius:6px;">
                <tr>
                  <td style="padding:16px 18px;font-size:14px;line-height:2;color:#333333;">
                    <strong>${tr(locale, "Fornavn", "First name")}:</strong> ${firstName}<br />
                    <strong>${tr(locale, "Etternavn", "Last name")}:</strong> ${lastName}<br />
                    <strong>${tr(locale, "E-post", "Email")}:</strong> <a href="mailto:${email}" style="color:${BRAND_BLUE};text-decoration:none;">${email}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Du kan nå logge inn med e-post og passord.",
                  "You can now log in with your email and password.",
                )}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(locale, "Vennlig hilsen,", "Warm regards,")}<br />
                <strong style="color:${BRAND_BLUE};">${tr(locale, "Tecno X-teamet", "The Tecno X Team")}</strong>
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getRegistrationEmailSubject(locale), bodyHtml);
}

export function buildRegistrationEmailText(data: RegistrationEmailData, locale: Locale): string {
  return `${tr(locale, "Hei", "Dear")} ${data.firstName} ${data.lastName},

${tr(locale, "Takk for at du registrerte deg hos Tecno X.", "Thank you for registering at Tecno X.")}

${tr(locale, "Fornavn", "First name")}: ${data.firstName}
${tr(locale, "Etternavn", "Last name")}: ${data.lastName}
${tr(locale, "E-post", "Email")}: ${data.email}

${tr(locale, "Du kan nå logge inn med e-post og passord.", "You can now log in with your email and password.")}

${tr(locale, "Vennlig hilsen,", "Warm regards,")}
Tecno X`;
}

export { getEmailBaseUrl };
