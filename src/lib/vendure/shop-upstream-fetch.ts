const TRANSIENT_NETWORK =
  /ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|ENOTFOUND|socket hang up|fetch failed|network/i;

/** True for short-lived TCP / DNS failures that often succeed on retry (common behind CapRover/nginx). */
export function isTransientShopNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  if (TRANSIENT_NETWORK.test(msg)) return true;
  if (e instanceof Error && e.cause != null) return isTransientShopNetworkError(e.cause);
  return false;
}

/** POST/GET to Vendure with small backoff on transient network errors. */
export async function shopUpstreamFetch(
  url: string,
  init: RequestInit,
  maxAttempts = 3,
): Promise<Response> {
  let last: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      last = e;
      if (!isTransientShopNetworkError(e) || attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 150 * attempt));
    }
  }
  throw last;
}

/** Operator-facing summary for logs / dev banners (English). */
export function shopNetworkErrorSummary(e: unknown): string {
  if (isTransientShopNetworkError(e)) {
    return (
      "Shop API connection failed (network reset or timeout). " +
      "On CapRover, set VENDURE_SHOP_API_URL to the internal service URL " +
      "(e.g. http://srv-captain--gastro-backend:3002/shop-api) on the storefront app."
    );
  }
  return e instanceof Error ? e.message : String(e);
}
