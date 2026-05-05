"use client";

import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

export function KontaktForm({ locale = "nb" }: { locale?: Locale }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="mt-10 space-y-5 max-w-xl"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
            {tr(locale, "Navn", "Name")}
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
            {tr(locale, "Bedrift", "Company")}
          </label>
          <input
            type="text"
            name="company"
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
            {tr(locale, "E-post", "Email")}
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
            {tr(locale, "Telefon", "Phone")}
          </label>
          <input
            type="tel"
            name="phone"
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
          {tr(locale, "Melding", "Message")}
        </label>
        <textarea
          name="message"
          rows={6}
          required
          placeholder={tr(
            locale,
            "Fortell oss kort om prosjektet eller utstyret du lurer på…",
            "Tell us briefly about your project or the equipment you need...",
          )}
          className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors resize-none"
        />
      </div>
      <button type="submit" className="btn-primary">
        {tr(locale, "Send forespørsel", "Send request")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
