"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { TopBar } from "@/components/site/TopBar";
import { shopRegisterAccount } from "@/lib/auth/shop-session-auth";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { getClientLocale, type Locale, tr } from "@/lib/locale";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import heroImg from "@/assets/hero-combi.jpg";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

export function RegisterView({ megaMenuByLocale = EMPTY_MEGA }: { megaMenuByLocale?: MegaMenuLocales }) {
  const lc = getClientLocale();
  const router = useRouter();
  const { refresh } = useShopAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = (): string | null => {
    if (password.length < 8) return tr(lc, "Passord må være minst 8 tegn.", "Password must be at least 8 characters.");
    if (password !== confirmPassword) return tr(lc, "Passordene stemmer ikke overens.", "Passwords do not match.");
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const ve = validate();
    if (ve) {
      setErr(ve);
      return;
    }
    setBusy(true);
    const r = await shopRegisterAccount(
      { email, password, firstName, lastName, phoneNumber: phone || undefined },
      lc,
    );
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    await refresh();
    router.replace("/konto");
  };

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar locale={lc} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>
      <PageHero
        label={tr(lc, "Konto", "Account")}
        title={tr(lc, "Ny konto", "New account")}
        crumbs={[{ label: tr(lc, "Registrer", "Register") }]}
        bgImage={heroImg}
      />
      <section className="container-x section-pad max-w-xl">
        <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr(lc, "Fornavn", "First name")} value={firstName} onChange={setFirstName} required />
            <Field label={tr(lc, "Etternavn", "Last name")} value={lastName} onChange={setLastName} required />
          </div>
          <Field label={tr(lc, "E-post", "Email")} type="email" value={email} onChange={setEmail} required />
          <Field label={tr(lc, "Telefon (valgfritt)", "Phone (optional)")} value={phone} onChange={setPhone} />
          <Field label={tr(lc, "Passord", "Password")} type="password" value={password} onChange={setPassword} required />
          <Field
            label={tr(lc, "Gjenta passord", "Confirm password")}
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
          {err ? <p className="rounded-[2px] border border-red-600/35 px-3 py-2 text-[13px] text-red-800">{err}</p> : null}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? tr(lc, "Oppretter …", "Creating …") : tr(lc, "Registrer", "Register")}
          </button>
          <p className="text-center text-[14px] text-[var(--color-muted)]">
            <Link href="/logg-inn" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
              {tr(lc, "Har du allerede konto? Logg inn", "Already have an account? Sign in")}
            </Link>
          </p>
        </form>
      </section>
      <Footer />
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  const lc = getClientLocale();
  const baseInputClass =
    "mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px]";
  return (
    <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)] sm:col-span-1">
      {label}
      {type === "password" ?
        <PasswordWithToggle
          value={value}
          onChange={onChange}
          required={required}
          autoComplete="new-password"
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className={`${baseInputClass} pr-11`}
        />
      : <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className={baseInputClass} />}
    </label>
  );
}
