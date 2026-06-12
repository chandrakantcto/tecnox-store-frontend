"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { tr } from "@/lib/locale";

export function TermsAcceptanceCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { locale: lc } = useLocale();

  return (
    <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-[var(--color-ink)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-copper)]"
      />
      <span>
        {tr(lc, "Jeg har lest og godtar ", "I have read and agree to the ")}{" "}
        <Link href="/vilkar" className="text-[var(--color-copper)] hover:underline">
          {tr(lc, "vilkårene", "Terms & Conditions")}
        </Link>
        {tr(lc, ", og samtykker til bruk av mine personopplysninger som beskrevet i ", ", and I consent to the use of my personal data as described in the ")}{" "}
        <Link href="/personvern" className="text-[var(--color-copper)] hover:underline">
          {tr(lc, "personvernerklæringen", "Privacy Policy")}
        </Link>
        .
      </span>
    </label>
  );
}
