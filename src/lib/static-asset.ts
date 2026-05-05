import type { StaticImageData } from "next/image";

/** Resolve Next.js static imports or URL strings for `<img src>` / metadata. */
export function staticSrc(src: string | StaticImageData): string {
  return typeof src === "object" && src !== null && "src" in src ? src.src : src;
}
