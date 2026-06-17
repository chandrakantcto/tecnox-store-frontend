"use client";

import { passwordRequirementsMessage } from "@/lib/auth/auth-messages";
import { useLocale } from "@/contexts/LocaleContext";

export function PasswordRequirementsHint() {
  const { locale: lc } = useLocale();
  return (
    <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-muted)]">
      {passwordRequirementsMessage(lc)}
    </p>
  );
}
