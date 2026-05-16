"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

export function KontaktForm({ locale = "nb" }: { locale?: Locale }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (submitted) {
    return (
      <div className="mt-10 max-w-xl bg-white border border-[var(--color-divider)] p-10 rounded-[3px] text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-copper)] text-white">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-[20px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
          {tr(locale, "Takk!", "Thank you!")}
        </h3>
        <p className="mt-3 text-[14px] text-[var(--color-muted)]">
          {tr(locale, "Meldingen er sendt. Vi tar kontakt så snart vi kan.", "Your message was sent — we’ll be in touch as soon as we can.")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const body = {
          name: fd.get("name"),
          company: fd.get("company"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          locale,
        };
        setSubmitting(true);
        try {
          const res = await fetch("/api/storefront/contact-enquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const json = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !json.ok) {
            setError(json.error ?? tr(locale, "Kunne ikke sende meldingen.", "Could not send your message."));
            return;
          }
          setSubmitted(true);
        } catch {
          setError(tr(locale, "Nettverksfeil — prøv igjen.", "Network error — please try again."));
        } finally {
          setSubmitting(false);
        }
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
            disabled={submitting}
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
            {tr(locale, "Bedrift", "Company")}
          </label>
          <input
            type="text"
            name="company"
            disabled={submitting}
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors disabled:opacity-60"
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
            disabled={submitting}
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
            {tr(locale, "Telefon", "Phone")}
          </label>
          <input
            type="tel"
            name="phone"
            disabled={submitting}
            className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors disabled:opacity-60"
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
          disabled={submitting}
          placeholder={tr(
            locale,
            "Fortell oss kort om prosjektet eller utstyret du lurer på…",
            "Tell us briefly about your project or the equipment you need...",
          )}
          className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors resize-none disabled:opacity-60"
        />
      </div>
      {error ? <p className="text-[13px] text-red-700">{error}</p> : null}
      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
        {submitting ? tr(locale, "Sender…", "Sending…") : tr(locale, "Send forespørsel", "Send request")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
