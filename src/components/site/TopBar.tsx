import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

export function TopBar({ locale = "nb" }: { locale?: Locale }) {
  const delivery = tr(locale, "Levering til hele Norge", "Delivery across Norway");
  const prices = tr(locale, "Alle priser eks. MVA", "All prices excl. VAT");
  const callUs = tr(locale, "Ring oss:", "Call us:");

  return (
    <div className="bg-[var(--dark-bg)] text-[var(--stone)]">
      <div className="container-x flex h-9 items-center justify-center text-center">
        <p className="text-[12px] font-normal tracking-wide">
          <span className="hidden sm:inline">{delivery}</span>
          <span className="hidden sm:inline mx-3 text-[var(--dark-muted)]">·</span>
          <span className="hidden md:inline">{prices}</span>
          <span className="hidden md:inline mx-3 text-[var(--dark-muted)]">·</span>
          <span>
            {callUs} <span className="text-[var(--copper)] font-medium">922 22 800</span>
          </span>
        </p>
      </div>
    </div>
  );
}
