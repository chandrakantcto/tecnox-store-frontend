import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

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

function emailSocialIcons(): string {
  const iconStyle =
    'display:inline-block;width:36px;height:36px;border:1px solid rgba(255,255,255,0.35);border-radius:50%;text-align:center;line-height:36px;margin:0 6px;';
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto 0;">
                <tr>
                  <td style="padding:0 4px;">
                    <a href="#" style="${iconStyle}text-decoration:none;color:#ffffff;" aria-label="LinkedIn">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E" width="16" height="16" alt="" style="vertical-align:middle;border:0;" />
                    </a>
                  </td>
                  <td style="padding:0 4px;">
                    <a href="#" style="${iconStyle}text-decoration:none;color:#ffffff;" aria-label="Instagram">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='white' stroke-width='2' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='20' height='20' rx='5'/%3E%3Ccircle cx='12' cy='12' r='4'/%3E%3Ccircle cx='17.5' cy='6.5' r='1' fill='white' stroke='none'/%3E%3C/svg%3E" width="16" height="16" alt="" style="vertical-align:middle;border:0;" />
                    </a>
                  </td>
                  <td style="padding:0 4px;">
                    <a href="#" style="${iconStyle}text-decoration:none;color:#ffffff;" aria-label="YouTube">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E" width="16" height="16" alt="" style="vertical-align:middle;border:0;" />
                    </a>
                  </td>
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
  const logoUrl = `${home}/logo-tecno-x.png`;
  const contact = tr(locale, "Kontakt", "Contact");
  const service = tr(locale, "Service", "Service");
  const products = tr(locale, "Produkter", "Products");
  const contactUs = tr(locale, "Kontakt oss", "Contact us");
  const tagline = tr(
    locale,
    "Utstyr som jobber like hardt som du gjør.",
    "Equipment that works as hard as you do.",
  );
  const copyright = `© ${new Date().getFullYear()} TECNOX AS`;

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
            <td style="padding:20px 24px;background-color:#1a1a1a;text-align:center;">
              <a href="${home}" style="text-decoration:none;display:inline-block;">
                <span style="display:inline-block;background-color:#f5f2ec;padding:10px 18px;border-radius:2px;">
                  <img src="${logoUrl}" alt="TECNOX" width="200" style="display:block;max-width:200px;width:200px;height:auto;border:0;margin:0 auto;" />
                </span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px;background-color:${BRAND_BLUE};text-align:center;">
              <a href="${home}/produkter" style="color:#ffffff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.12em;margin:0 10px;">${products}</a>
              <a href="${home}/service" style="color:#ffffff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.12em;margin:0 10px;">${service}</a>
              <a href="${home}/kontakt" style="color:#ffffff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.12em;margin:0 10px;">${contact}</a>
            </td>
          </tr>
          ${bodyHtml}
          <tr>
            <td style="padding:28px 24px;background-color:#1a1a1a;text-align:center;color:#c4bbbd;font-size:13px;line-height:1.7;">
              <a href="${home}" style="text-decoration:none;display:inline-block;margin-bottom:12px;">
                <span style="display:inline-block;background-color:#f5f2ec;padding:8px 14px;border-radius:2px;">
                  <img src="${logoUrl}" alt="TECNOX" width="160" style="display:block;max-width:160px;width:160px;height:auto;border:0;margin:0 auto;" />
                </span>
              </a>
              <p style="margin:0 0 16px;font-size:14px;color:#c4bbbd;max-width:320px;display:inline-block;line-height:1.6;">
                ${escapeHtml(tagline)}
              </p>
              ${emailSocialIcons()}
              <p style="margin:20px 0 8px;font-size:15px;font-weight:700;color:#ffffff;">${contactUs}</p>
              <p style="margin:0 0 4px;">
                ${tr(locale, "E-post", "Email")}: <a href="mailto:post@tecnox.no" style="color:#ffffff;text-decoration:underline;">post@tecnox.no</a>
              </p>
              <p style="margin:0 0 16px;">
                ${tr(locale, "Telefon", "Phone")}: <a href="tel:92222800" style="color:#ffffff;text-decoration:none;">922 22 800</a>
              </p>
              <p style="margin:0;font-size:12px;color:#888888;">${copyright}</p>
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
