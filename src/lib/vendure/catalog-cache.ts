import { unstable_cache } from "next/cache";

/** Shared tag for catalog/navigation data invalidated by `/api/revalidate-cache`. */
export const STOREFRONT_CATALOG_CACHE_TAG = "storefront-catalog";

/** True when Shop API + catalog loaders should always hit upstream (local dev default). */
export function isStorefrontCatalogCacheDisabled(): boolean {
  const envSeconds = process.env.VENDURE_SHOP_CACHE_SECONDS;
  if (envSeconds !== undefined && envSeconds !== "") {
    return Number(envSeconds) === 0;
  }
  return process.env.NODE_ENV === "development";
}

/**
 * Cross-request catalog cache with tag-based invalidation.
 * Use for Shop API loaders that must refresh after admin catalog changes.
 */
export function catalogCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
) {
  if (isStorefrontCatalogCacheDisabled()) {
    return fn;
  }
  return unstable_cache(fn, keyParts, { tags: [STOREFRONT_CATALOG_CACHE_TAG] });
}
