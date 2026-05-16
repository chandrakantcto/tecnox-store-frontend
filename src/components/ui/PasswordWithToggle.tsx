"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordWithToggleProps = {
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  name?: string;
  id?: string;
  className?: string;
  showLabel: string;
  hideLabel: string;
};

export function PasswordWithToggle({
  value,
  onChange,
  required,
  disabled,
  autoComplete,
  name,
  id,
  className = "",
  showLabel,
  hideLabel,
}: PasswordWithToggleProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={className}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[2px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] disabled:opacity-50"
        aria-label={visible ? hideLabel : showLabel}
      >
        {visible ?
          <EyeOff className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        : <Eye className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
