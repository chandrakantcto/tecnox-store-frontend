"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  flagEmoji,
  getPhoneCountry,
  phoneCountryLabel,
  PHONE_COUNTRIES,
  type PhoneCountry,
} from "@/lib/phone/country-codes";
import { buildStoredPhone, digitsOnly, parseStoredPhone } from "@/lib/phone/phone-format";
import { useLocale } from "@/contexts/LocaleContext";
import { tr } from "@/lib/locale";

export type PhoneInputWithCountryProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  inputClassName?: string;
  hasError?: boolean;
};

export function PhoneInputWithCountry({
  value,
  onChange,
  disabled,
  required,
  id,
  className = "",
  inputClassName = "",
  hasError,
}: PhoneInputWithCountryProps) {
  const { locale } = useLocale();
  const lc = locale === "en" ? "en" : "nb";
  const parsed = useMemo(() => parseStoredPhone(value), [value]);
  const country = getPhoneCountry(parsed.countryIso);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((entry: PhoneCountry) => {
      const label = phoneCountryLabel(entry, lc).toLowerCase();
      return (
        label.includes(q) ||
        entry.iso.toLowerCase().includes(q) ||
        entry.dialCode.includes(q.replace(/^\+/, "")) ||
        `+${entry.dialCode}`.includes(q)
      );
    });
  }, [query, lc]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const updateCountry = (iso: string) => {
    onChange(buildStoredPhone(iso, parsed.nationalNumber));
    setOpen(false);
  };

  const updateNational = (next: string) => {
    onChange(buildStoredPhone(parsed.countryIso, digitsOnly(next)));
  };

  const borderClass = hasError
    ? "border-red-600 focus-within:border-red-700"
    : "border-[var(--color-divider)] focus-within:border-[var(--color-copper)]";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={`flex overflow-hidden rounded-[2px] border bg-white transition-colors focus-within:outline-none ${borderClass}`}
      >
        <button
          type="button"
          id={id ? `${id}-country` : undefined}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="flex shrink-0 cursor-pointer items-center gap-1 border-r border-[var(--color-divider)] bg-[var(--color-stone)]/20 px-2 py-3 text-[12px] text-[var(--color-ink)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:text-[13px]"
          aria-label={tr(lc, "Velg landskode", "Select country code")}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="text-[16px] leading-none" aria-hidden="true">{flagEmoji(country.iso)}</span>
          <span className="font-medium">+{country.dialCode}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden="true" />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={parsed.nationalNumber}
          onChange={(e) => updateNational(e.target.value)}
          disabled={disabled}
          required={required}
          maxLength={15}
          placeholder={country.iso === DEFAULT_PHONE_COUNTRY_ISO ? "1234567890" : ""}
          className={`min-w-0 flex-1 border-0 px-3 py-3 text-[13px] text-[var(--color-ink)] focus:outline-none disabled:opacity-60 sm:px-4 sm:text-[14px] ${inputClassName}`}
          aria-label={tr(lc, "Telefonnummer", "Phone number")}
        />
      </div>

      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-[min(100%,280px)] max-w-[320px] rounded-[3px] border border-[var(--color-divider)] bg-white shadow-lg sm:min-w-[300px]"
          role="listbox"
          aria-label={tr(lc, "Velg land", "Select country")}
        >
          <div className="border-b border-[var(--color-divider)] p-2">
            <div className="flex items-center gap-2 rounded-[2px] border border-[var(--color-divider)] bg-[var(--color-stone)]/30 px-2 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr(lc, "Søk land …", "Search country …")}
                className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--color-ink)] focus:outline-none"
                aria-label={tr(lc, "Søk land", "Search country")}
              />
            </div>
          </div>
          <ul className="max-h-[240px] overflow-y-auto py-1">
            {filteredCountries.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-[var(--color-muted)]">
                {tr(lc, "Ingen treff", "No matches")}
              </li>
            ) : (
              filteredCountries.map((entry: PhoneCountry) => {
                const selected = entry.iso === parsed.countryIso;
                return (
                  <li key={entry.iso}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => updateCountry(entry.iso)}
                      className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[var(--color-copper)]/10 ${
                        selected ? "bg-[var(--color-copper)]/15 font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink)]"
                      }`}
                    >
                      <span className="text-[18px] leading-none shrink-0" aria-hidden="true">
                        {flagEmoji(entry.iso)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{phoneCountryLabel(entry, lc)}</span>
                      <span className="shrink-0 text-[var(--color-muted)]">+{entry.dialCode}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
