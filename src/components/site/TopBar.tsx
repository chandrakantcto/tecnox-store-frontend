"use client";

import { useActiveLocale } from "@/hooks/use-active-locale";
import { tr } from "@/lib/locale";
import { topBarPricesLabel } from "@/lib/vat-display";
import { useVatDisplay } from "@/contexts/VatDisplayContext";
import { formatShopBannerError } from "@/lib/vendure/shop-banner-error";

export function TopBar({
  catalogError,
}: {
  /** Non-fatal API/config issues — slim storefront notice */
  catalogError?: string | null;
}) {
  const locale = useActiveLocale();
  const { vatIncluded, setVatIncluded } = useVatDisplay();
  const delivery = tr(locale, "Levering til hele Norge", "Delivery across Norway");
  const prices = topBarPricesLabel(locale, vatIncluded);
  const callUs = tr(locale, "Ring oss:", "Call us:");
  const apiMsg = catalogError ? formatShopBannerError(catalogError) : null;

  return (
    <>
      {apiMsg && (
        <div
          className="bg-amber-900/95 text-amber-50 text-[11px] border-b border-amber-800/80"
          role="status"
        >
          <p className="container-x py-1 text-center">{apiMsg}</p>
        </div>
      )}
      <div className="bg-[var(--dark-bg)] text-[var(--stone)]">
        <div className="container-x flex h-9 items-center gap-4">
          <p className="min-w-0 flex-1 text-[10px] sm:text-[12px] font-normal tracking-wide leading-tight">
            <span className="hidden lg:inline">{delivery}</span>
            <span className="hidden lg:inline mx-3 text-[var(--dark-muted)]">·</span>
            <span>{prices}</span>
            <span className="hidden md:inline mx-3 text-[var(--dark-muted)]">·</span>
            <span className="hidden md:inline">
              {callUs} <span className="text-[var(--copper)] font-medium">411 90 600</span>
            </span>
          </p>

          <div className="flex shrink-0 items-center justify-end">
            <div className="grid grid-cols-2 overflow-hidden rounded-[2px] border border-white/30">
              <button
                type="button"
                onClick={() => setVatIncluded(true)}
                className={`px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap transition-colors sm:px-3 ${
                  vatIncluded
                    ? "bg-white text-[var(--dark-bg)]"
                    : "bg-transparent text-[var(--stone)] hover:bg-white/10"
                }`}
                aria-pressed={vatIncluded}
              >
                {tr(locale, "Inkl. MVA", "Incl. VAT")}
              </button>
              <button
                type="button"
                onClick={() => setVatIncluded(false)}
                className={`px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap transition-colors sm:px-3 ${
                  !vatIncluded
                    ? "bg-white text-[var(--dark-bg)]"
                    : "bg-transparent text-[var(--stone)] hover:bg-white/10"
                }`}
                aria-pressed={!vatIncluded}
              >
                {tr(locale, "Ekskl. MVA", "Excl. VAT")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
