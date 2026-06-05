import type { StaticImageData } from "next/image";

/** True when catalog/PDP uses the built-in SVG fallback instead of a Vendure asset. */
export function isStorefrontSvgPlaceholder(src: string | null | undefined): boolean {
  if (!src?.trim()) return false;
  return src.startsWith("data:image/svg+xml") && src.includes("TECNOX");
}

export function isMissingStorefrontImage(src: string | null | undefined): boolean {
  if (!src?.trim()) return true;
  return isStorefrontSvgPlaceholder(src);
}

export function isMissingStorefrontImageSource(
  src: string | StaticImageData | null | undefined,
): boolean {
  if (typeof src === "string") return isMissingStorefrontImage(src);
  return false;
}
