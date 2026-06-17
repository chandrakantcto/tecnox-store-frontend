"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { AuthFieldGroup } from "@/components/account/AuthFieldGroup";
import { useActiveLocale } from "@/hooks/use-active-locale";
import {
  invalidEmailFormatMessage,
  invalidPhoneNumberMessage,
} from "@/lib/auth/auth-messages";
import {
  isBlankInput,
  isValidEmail,
  isValidPhoneDigits,
  normalizeAuthEmail,
} from "@/lib/auth/email-validation";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";
import { firstFieldError } from "@/lib/auth/field-errors";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

type ContactFieldKey = "name" | "email" | "phone" | "message";

const CONTACT_LABEL =
  "block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2";
const CONTACT_INPUT =
  "w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors disabled:opacity-60";

function requiredNameMessage(locale: Locale): string {
  return tr(locale, "Navn er påkrevd.", "Name is required.");
}

function requiredEmailMessage(locale: Locale): string {
  return tr(locale, "E-post er påkrevd.", "Email is required.");
}

function requiredMessageMessage(locale: Locale): string {
  return tr(locale, "Melding er påkrevd.", "Message is required.");
}

export function KontaktForm({ locale: _locale }: { locale?: Locale }) {
  const locale = useActiveLocale();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactFieldKey, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: ContactFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const collectFieldErrors = (): Partial<Record<ContactFieldKey, string>> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    return firstFieldError<ContactFieldKey>([
      { field: "name", message: isBlankInput(trimmedName) ? requiredNameMessage(locale) : null },
      {
        field: "email",
        message: isBlankInput(trimmedEmail)
          ? requiredEmailMessage(locale)
          : !isValidEmail(trimmedEmail)
            ? invalidEmailFormatMessage(locale)
            : null,
      },
      {
        field: "phone",
        message: !isValidPhoneDigits(trimmedPhone) ? invalidPhoneNumberMessage(locale) : null,
      },
      { field: "message", message: isBlankInput(trimmedMessage) ? requiredMessageMessage(locale) : null },
    ]);
  };

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
        setFieldErrors({});
        setSubmitError(null);

        const trimmedName = name.trim();
        const trimmedCompany = company.trim();
        const trimmedEmail = normalizeAuthEmail(email);
        const trimmedPhone = phone.trim();
        const trimmedMessage = message.trim();

        setName(trimmedName);
        setCompany(trimmedCompany);
        setEmail(trimmedEmail);
        setPhone(trimmedPhone);
        setMessage(trimmedMessage);

        const errors = collectFieldErrors();
        if (Object.keys(errors).length) {
          setFieldErrors(errors);
          return;
        }

        setSubmitting(true);
        try {
          const res = await fetch("/api/storefront/contact-enquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: trimmedName,
              company: trimmedCompany || undefined,
              email: trimmedEmail,
              phone: trimmedPhone || undefined,
              message: trimmedMessage,
              locale,
            }),
          });
          const json = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !json.ok) {
            setSubmitError(json.error ?? tr(locale, "Kunne ikke sende meldingen.", "Could not send your message."));
            return;
          }
          setSubmitted(true);
        } catch {
          setSubmitError(tr(locale, "Nettverksfeil — prøv igjen.", "Network error — please try again."));
        } finally {
          setSubmitting(false);
        }
      }}
      className="mt-10 space-y-5 max-w-xl"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <AuthFieldGroup
          label={tr(locale, "Navn", "Name")}
          error={fieldErrors.name}
          labelClassName={CONTACT_LABEL}
        >
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            onBlur={() => setName((v) => v.trim())}
            disabled={submitting}
            maxLength={100}
            className={CONTACT_INPUT}
          />
        </AuthFieldGroup>
        <AuthFieldGroup label={tr(locale, "Bedrift", "Company")} labelClassName={CONTACT_LABEL}>
          <input
            type="text"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onBlur={() => setCompany((v) => v.trim())}
            disabled={submitting}
            maxLength={100}
            className={CONTACT_INPUT}
          />
        </AuthFieldGroup>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <AuthFieldGroup
          label={tr(locale, "E-post", "Email")}
          error={fieldErrors.email}
          labelClassName={CONTACT_LABEL}
        >
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            onBlur={() => setEmail((v) => v.trim())}
            disabled={submitting}
            maxLength={255}
            className={CONTACT_INPUT}
          />
        </AuthFieldGroup>
        <AuthFieldGroup
          label={tr(locale, "Telefon", "Phone")}
          error={fieldErrors.phone}
          labelClassName={CONTACT_LABEL}
        >
          <PhoneInputWithCountry
            value={phone}
            onChange={(v) => {
              setPhone(v);
              clearFieldError("phone");
            }}
            disabled={submitting}
            hasError={Boolean(fieldErrors.phone)}
          />
        </AuthFieldGroup>
      </div>
      <AuthFieldGroup
        label={tr(locale, "Melding", "Message")}
        error={fieldErrors.message}
        labelClassName={CONTACT_LABEL}
      >
        <textarea
          name="message"
          rows={6}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            clearFieldError("message");
          }}
          disabled={submitting}
          placeholder={tr(
            locale,
            "Fortell oss kort om prosjektet eller utstyret du lurer på…",
            "Tell us briefly about your project or the equipment you need...",
          )}
          maxLength={2000}
          className={`${CONTACT_INPUT} resize-none`}
        />
      </AuthFieldGroup>
      {submitError ? <p className="text-[13px] text-red-700">{submitError}</p> : null}
      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
        {submitting ? tr(locale, "Sender…", "Sending…") : tr(locale, "Send forespørsel", "Send request")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
