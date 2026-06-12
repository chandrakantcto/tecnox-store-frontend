import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { buildTecnoXEmailShell, escapeHtml, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export function getPasswordChangedEmailSubject(locale: Locale): string {
  return tr(locale, "TECNOX — passordet ditt er oppdatert", "TECNOX — your password has been updated");
}

export function buildPasswordChangedEmailHtml(email: string, baseUrl: string, locale: Locale): string {
  const safeEmail = escapeHtml(email);

  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Passord", "Password")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "oppdatert", "updated")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Hei,", "Hello,")}</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Passordet for TECNOX-kontoen din er oppdatert.",
                  "The password for your TECNOX account has been updated.",
                )}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:#fafafa;border:1px solid #ececec;border-radius:6px;">
                <tr>
                  <td style="padding:16px 18px;font-size:14px;line-height:2;color:#333333;">
                    <strong>${tr(locale, "E-post", "Email")}:</strong> <a href="mailto:${safeEmail}" style="color:${BRAND_BLUE};text-decoration:none;">${safeEmail}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Du kan nå logge inn med det nye passordet.",
                  "You can now sign in with your new password.",
                )}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#666666;">
                ${tr(
                  locale,
                  "Hvis du ikke gjorde denne endringen, kontakt oss på post@tecnox.no.",
                  "If you did not make this change, contact us at post@tecnox.no.",
                )}
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getPasswordChangedEmailSubject(locale), bodyHtml);
}

export function buildPasswordChangedEmailText(email: string, locale: Locale): string {
  return `${tr(locale, "Hei,", "Hello,")}

${tr(locale, "Passordet for TECNOX-kontoen din er oppdatert.", "The password for your TECNOX account has been updated.")}

${tr(locale, "E-post", "Email")}: ${email}

${tr(locale, "Du kan nå logge inn med det nye passordet.", "You can now sign in with your new password.")}`;
}
