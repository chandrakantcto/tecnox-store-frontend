"use client";

import { useState } from "react";
import { ImageUnavailablePlaceholder } from "@/components/site/ImageUnavailablePlaceholder";
import { isMissingStorefrontImage } from "@/lib/storefront-image";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type StorefrontRemoteImageProps = {
  src: string | null | undefined;
  alt: string;
  locale: Locale;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  compact?: boolean;
};

export function StorefrontRemoteImage({
  src,
  alt,
  locale,
  className,
  width = 1024,
  height = 768,
  loading = "lazy",
  fill = false,
  compact = false,
}: StorefrontRemoteImageProps) {
  const [failed, setFailed] = useState(false);
  const missing = isMissingStorefrontImage(src) || failed;

  if (missing) {
    return (
      <ImageUnavailablePlaceholder
        locale={locale}
        compact={compact || fill}
        className={cn(fill && "absolute inset-0 min-h-0", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src!}
      alt={alt}
      loading={loading}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      onError={() => setFailed(true)}
      className={cn(
        fill ? "absolute inset-0 h-full w-full object-cover" : "h-full w-full object-cover",
        className,
      )}
    />
  );
}
