/**
 * Vendor Shop API (Vendure GraphQL endpoint) — configuration comes only from the environment.
 * Set values per deployment in `.env.local`, `.env.production`, CI secrets, etc. (never hardcode URLs or ports).
 *
 * Required for catalog features:
 * - `NEXT_PUBLIC_VENDURE_SHOP_API_URL` — full URL to the Shop API, including protocol, host, port (if non-default),
 *   and path, e.g. `{protocol}://{host}:{optionalPort}/shop-api`.
 *
 * Asset previews that are relative (`/assets/...`) use the origin of this URL as the base.
 */

export type VendurePublicConfig = {
  shopApiUrl: string;
  /** Origin derived from Shop API URL — used only to prefix relative asset paths */
  assetBaseUrl: string;
};

const SHOP_ENV = "NEXT_PUBLIC_VENDURE_SHOP_API_URL" as const;

function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/, "");
}

/**
 * Parses and normalizes the vendor Shop GraphQL endpoint from env.
 * Returns `null` when unset — callers must degrade gracefully or surface a setup error.
 */
export function resolveVendureShopConfig(): VendurePublicConfig | null {
  const raw = typeof process.env[SHOP_ENV] === "string" ? process.env[SHOP_ENV]!.trim() : "";
  if (!raw.length) return null;

  try {
    const shopApiUrl = stripTrailingSlashes(raw);
    const u = new URL(shopApiUrl);
    const assetBaseUrl = stripTrailingSlashes(`${u.origin}`);
    return { shopApiUrl, assetBaseUrl };
  } catch {
    return null;
  }
}

export function vendureShopEnvVarName(): typeof SHOP_ENV {
  return SHOP_ENV;
}

/**
 * Detects common misconfiguration: Shop env var pointing at **Admin API** (`/admin-api`).
 * Plugin storefront mutations (`submitQuoteRequest`, etc.) exist only on the **Shop API** (`/shop-api` by default).
 */
export function vendureLikelyWrongApiEndpointHint(url: string): string | null {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw.length) return null;
  try {
    const u = new URL(raw);
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    const isAdmin = path.endsWith("/admin-api") || path === "/admin-api";
    const isShop = path.endsWith("/shop-api") || path.endsWith("/shop-api/graphql") || path === "/shop-api";
    if (isAdmin && !isShop) {
      const suggestedPath = `${u.pathname.replace(/\/admin-api$/i, "/shop-api").replace(/\/+$/, "")}`;
      return `${SHOP_ENV} must target the Shop API (e.g. …/shop-api), not Admin API (${u.pathname}). Try ${u.origin}${suggestedPath}`;
    }
  } catch {
    /* noop */
  }
  return null;
}
