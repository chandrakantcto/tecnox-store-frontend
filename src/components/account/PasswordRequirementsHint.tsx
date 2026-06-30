"use client";

import { passwordBasicRequirementsMessage, passwordRequirementsMessage } from "@/lib/auth/auth-messages";
import { useLocale } from "@/contexts/LocaleContext";

export function PasswordRequirementsHint({ basic = false }: { basic?: boolean }) {
  const { locale: lc } = useLocale();
  return (
    <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-muted)]">
      {basic ? passwordBasicRequirementsMessage(lc) : passwordRequirementsMessage(lc)}
    </p>
  );
}
