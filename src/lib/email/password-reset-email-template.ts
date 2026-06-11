import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { buildTecnoXEmailShell, escapeHtml, BRAND_BLUE } from "@/lib/email/tecno-x-email-shell";

export function getPasswordResetEmailSubject(locale: Locale): string {
  return tr(locale, "TECNOX — tilbakestill passord", "TECNOX — reset your password");
}

export function buildPasswordResetEmailHtml(otp: string, baseUrl: string, locale: Locale): string {
  const formattedOtp = escapeHtml(otp).split("").join(" ");

  const bodyHtml = `
          <tr>
            <td style="padding:36px 32px 28px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#111111;font-weight:700;">
                ${tr(locale, "Tilbakestill", "Reset")}<span style="color:${BRAND_BLUE};padding:0 4px;"> ${tr(locale, "passord", "password")}</span>
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                <strong>${tr(locale, "Hei,", "Hello,")}</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Bruk koden nedenfor for å tilbakestille passordet ditt.",
                  "Use the code below to reset your password.",
                )}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:#fafafa;border:1px solid #ececec;border-radius:6px;">
                <tr>
                  <td align="center" style="padding:20px 18px;font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND_BLUE};">
                    ${formattedOtp}
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(locale, "Koden er gyldig i 15 minutter.", "This code is valid for 15 minutes.")}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">
                ${tr(
                  locale,
                  "Hvis du ikke ba om dette, kan du ignorere denne e-posten.",
                  "If you did not request this, you can ignore this email.",
                )}
              </p>
            </td>
          </tr>`;

  return buildTecnoXEmailShell(locale, baseUrl, getPasswordResetEmailSubject(locale), bodyHtml);
}

export function buildPasswordResetEmailText(otp: string, locale: Locale): string {
  return `${tr(locale, "Hei,", "Hello,")}

${tr(locale, "Bruk denne koden for å tilbakestille passordet:", "Use this code to reset your password:")}

${otp}

${tr(locale, "Koden er gyldig i 15 minutter.", "This code is valid for 15 minutes.")}`;
}
