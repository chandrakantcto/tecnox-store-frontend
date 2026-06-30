import { unstable_cache } from "next/cache";

/** Shared tag for catalog/navigation data invalidated by `/api/revalidate-cache`. */
export const STOREFRONT_CATALOG_CACHE_TAG = "storefront-catalog";

/**
 * Cross-request catalog cache with tag-based invalidation.
 * Use for Shop API loaders that must refresh after admin catalog changes.
 */
export function catalogCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
) {
  return unstable_cache(fn, keyParts, { tags: [STOREFRONT_CATALOG_CACHE_TAG] });
}
