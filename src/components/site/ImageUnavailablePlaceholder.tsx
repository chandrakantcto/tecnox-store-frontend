"use client";

import { ImageOff } from "lucide-react";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function ImageUnavailablePlaceholder({
  locale,
  className,
  compact = false,
}: {
  locale: Locale;
  className?: string;
  compact?: boolean;
}) {
  const label = tr(locale, "Bilde ikke tilgjengelig", "No image available");

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center border border-[var(--color-divider)] bg-[var(--color-stone)] text-center",
        compact ? "gap-1 px-1" : "min-h-[120px] gap-3 px-4",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <ImageOff
        className={cn(
          "text-[var(--color-muted)]/65",
          compact ? "h-5 w-5" : "h-9 w-9",
        )}
        strokeWidth={1.4}
      />
      {compact ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="max-w-[12rem] text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-[var(--color-muted)]">
          {label}
        </span>
      )}
    </div>
  );
}
