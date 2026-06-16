import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { EMAIL_CID, cidSrc } from "@/lib/email/email-assets";

const BRAND_BLUE = "#1a7fd4";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getEmailBaseUrl(fallbackOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (fallbackOrigin) return fallbackOrigin.replace(/\/+$/, "");
  return "https://tecnox.no";
}

function emailNavLink(href: string, label: string): string {
  return `<a href="${href}" style="color:#ffffff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.12em;margin:0 8px;">${label}</a>`;
}

function emailLogoBlock(home: string, logoSrc: string, width: number, pad: string): string {
  return `<a href="${home}" style="text-decoration:none;display:inline-block;">
                <span style="display:inline-block;background-color:#f5f2ec;padding:${pad};border-radius:2px;">
                  <img src="${logoSrc}" alt="Tecno X" width="${width}" style="display:block;max-width:${width}px;width:${width}px;height:auto;border:0;margin:0 auto;" />
                </span>
              </a>`;
}

function emailSocialIcon(label: string, glyph: string): string {
  return `<td style="padding:0 5px;">
                    <a href="#" aria-label="${label}" style="text-decoration:none;display:inline-block;width:36px;height:36px;border:1px solid rgba(255,255,255,0.35);border-radius:50%;color:#ffffff;font-size:14px;font-weight:600;line-height:36px;text-align:center;">${glyph}</a>
                  </td>`;
}

function emailSocialIcons(): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  ${emailSocialIcon("LinkedIn", "in")}
                  ${emailSocialIcon("Instagram", "&#9678;")}
                  ${emailSocialIcon("YouTube", "&#9654;")}
                </tr>
              </table>`;
}

export function buildTecnoXEmailShell(
  locale: Locale,
  baseUrl: string,
  pageTitle: string,
  bodyHtml: string,
): string {
  const safeTitle = escapeHtml(pageTitle);
  const home = escapeHtml(baseUrl);
  const logoSrc = cidSrc(EMAIL_CID.logo);
  const homeLabel = tr(locale, "Hjem", "Home");
  const products = tr(locale, "Produkter", "Products");
  const service = tr(locale, "Service", "Service");
  const contact = tr(locale, "Kontakt", "Contact");
  const contactUs = tr(locale, "Kontakt oss", "Contact us");
  const tagline = tr(
    locale,
    "Utstyr som jobber like hardt som du gjør.",
    "Equipment that works as hard as you do.",
  );
  const copyright = `© ${new Date().getFullYear()} Tecno X AS`;
  const navSep = `<span style="color:rgba(255,255,255,0.65);font-size:11px;margin:0 2px;">·</span>`;

  const nav = [
    emailNavLink(home, homeLabel),
    navSep,
    emailNavLink(`${home}/produkter`, products),
    navSep,
    emailNavLink(`${home}/service`, service),
    navSep,
    emailNavLink(`${home}/kontakt`, contact),
  ].join("");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f2ec;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f2ec;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:16px 24px;background-color:#1a1a1a;text-align:center;">
              ${emailLogoBlock(home, logoSrc, 180, "10px 18px")}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px;background-color:${BRAND_BLUE};text-align:center;">
              ${nav}
            </td>
          </tr>
          ${bodyHtml}
          <tr>
            <td style="padding:20px 16px 24px;background-color:#1a1a1a;text-align:center;color:#c4bbbd;font-size:12px;line-height:1.7;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:10px;">
                    ${emailLogoBlock(home, logoSrc, 140, "8px 14px")}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 20px 14px;font-size:13px;color:#c4bbbd;line-height:1.6;">
                    ${escapeHtml(tagline)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    ${emailSocialIcons()}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px;font-size:15px;font-weight:700;color:#ffffff;">
                    ${contactUs}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:4px;color:#c4bbbd;">
                    ${tr(locale, "E-post", "Email")}: <a href="mailto:post@tecnox.no" style="color:#ffffff;text-decoration:underline;">post@tecnox.no</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;color:#c4bbbd;">
                    ${tr(locale, "Telefon", "Phone")}: <a href="tel:92222800" style="color:#ffffff;text-decoration:none;">411 90 600</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:11px;color:#888888;">
                    ${copyright}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { escapeHtml, BRAND_BLUE };
