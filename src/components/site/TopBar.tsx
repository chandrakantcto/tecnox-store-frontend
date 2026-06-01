"use client";

import { useActiveLocale } from "@/hooks/use-active-locale";
import { tr } from "@/lib/locale";

export function TopBar({
  catalogError,
}: {
  /** Non-fatal API/config issues — slim storefront notice */
  catalogError?: string | null;
}) {
  const locale = useActiveLocale();
  const delivery = tr(locale, "Levering til hele Norge", "Delivery across Norway");
  const prices = tr(locale, "Alle priser eks. MVA", "All prices excl. VAT");
  const callUs = tr(locale, "Ring oss:", "Call us:");

  return (
    <>
      {catalogError && (
        <div
          className="bg-amber-900/95 text-amber-50 text-[11px] px-3 py-1 text-center border-b border-amber-800/80"
          role="status"
        >
          {catalogError}
        </div>
      )}
      <div className="bg-[var(--dark-bg)] text-[var(--stone)]">
        <div className="container-x flex h-9 items-center justify-center text-center max-w-screen">
          <p className="  text-[10px] sm:text-[12px]
      font-normal tracking-wide
      flex flex-wrap justify-center items-center
      gap-y-1">
            <span>{delivery}</span>
            <span className=" mx-3 text-[var(--dark-muted)]">·</span>
            <span>{prices}</span>
            <span className="mx-3 text-[var(--dark-muted)]">·</span>
            <span>
              {callUs} <span className="text-[var(--copper)] font-medium">922 22 800</span>
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
