"use client";

import { AuthValidationAlert } from "@/components/account/AuthValidationAlert";

/** Label + control + optional field error (below control). Auth/contact forms only. */
export function AuthFieldGroup({
  label,
  error,
  children,
  labelClassName = "block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]",
}: {
  label?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  labelClassName?: string;
}) {
  return (
    <div>
      {label ? <div className={labelClassName}>{label}</div> : null}
      {children}
      {error ? (
        <div className="mt-1">
          <AuthValidationAlert>{error}</AuthValidationAlert>
        </div>
      ) : null}
    </div>
  );
}
