"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { TopBar } from "@/components/site/TopBar";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { shopLoginEmailPassword, shopRegisterAccount } from "@/lib/auth/shop-session-auth";
import { useLocale } from "@/contexts/LocaleContext";
import { tr } from "@/lib/locale";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import heroImg from "@/assets/hero-combi.jpg";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

export type AuthTab = "login" | "register";

function AuthTabs({ active }: { active: AuthTab }) {
  const { locale: lc } = useLocale();
  return (
    <div className="mb-6 flex gap-6 ">
      <Link
        href="/logg-inn"
        data-active={active === "login" ? "true" : "false"}
        className="nav-link shrink-0 px-1 pb-2 text-[13px] font-medium"
      >
        {tr(lc, "Logg inn", "Sign in")}
      </Link>
      <Link
        href="/registrer"
        data-active={active === "register" ? "true" : "false"}
        className="nav-link shrink-0 px-1 pb-2 text-[13px] font-medium"
      >
        {tr(lc, "Registrer", "Register")}
      </Link>
    </div>
  );
}

function LoginPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const rawNext = sp.get("next") || "/konto";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/konto";
  const { locale: lc } = useLocale();
  const { refresh } = useShopAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const r = await shopLoginEmailPassword(email, password, lc);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    await refresh();
    router.replace(next);
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5">
      <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {tr(lc, "E-post", "Email")}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px]"
        />
      </label>
      <div>
        <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <span>{tr(lc, "Passord", "Password")}</span>
          <Link
            href="/forgot-password"
            className="text-[14px] normal-case tracking-normal text-[var(--color-copper)] hover:underline"
          >
            {tr(lc, "Glemt passord?", "Forgot password?")}
          </Link>
        </div>
        <PasswordWithToggle
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 pr-11 text-[14px]"
        />
      </div>
      {err ? (
        <p className="rounded-[2px] border border-red-600/35 bg-white px-3 py-2 text-[13px] text-red-800">{err}</p>
      ) : null}
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? tr(lc, "Logger inn …", "Signing in …") : tr(lc, "Logg inn", "Sign in")}
      </button>
    </form>
  );
}

function RegisterPanel() {
  const { locale: lc } = useLocale();
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
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <RegisterField label={tr(lc, "Fornavn", "First name")} value={firstName} onChange={setFirstName} required />
        <RegisterField label={tr(lc, "Etternavn", "Last name")} value={lastName} onChange={setLastName} required />
      </div>
      <RegisterField label={tr(lc, "E-post", "Email")} type="email" value={email} onChange={setEmail} required />
      <RegisterField label={tr(lc, "Telefon (valgfritt)", "Phone (optional)")} value={phone} onChange={setPhone} />
      <RegisterField label={tr(lc, "Passord", "Password")} type="password" value={password} onChange={setPassword} required />
      <RegisterField
        label={tr(lc, "Gjenta passord", "Confirm password")}
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
      />
      {err ? (
        <p className="rounded-[2px] border border-red-600/35 px-3 py-2 text-[13px] text-red-800">{err}</p>
      ) : null}
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? tr(lc, "Oppretter …", "Creating …") : tr(lc, "Registrer", "Register")}
      </button>
    </form>
  );
}

function RegisterField({
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
  const { locale: lc } = useLocale();
  const baseInputClass = "mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px]";
  return (
    <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)] sm:col-span-1">
      {label}
      {type === "password" ? (
        <PasswordWithToggle
          value={value}
          onChange={onChange}
          required={required}
          autoComplete="new-password"
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className={`${baseInputClass} pr-11`}
        />
      ) : (
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      )}
    </label>
  );
}

function AccountAuthContent({
  megaMenuByLocale,
  initialTab,
}: {
  megaMenuByLocale: MegaMenuLocales;
  initialTab: AuthTab;
}) {
  const { locale: lc } = useLocale();
  const isLogin = initialTab === "login";

  return (
    <main className=" bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>
      <PageHero
        label={tr(lc, "Konto", "Account")}
        title={isLogin ? tr(lc, "Logg inn", "Sign in") : tr(lc, "Ny konto", "New account")}
        description={
          isLogin
            ? tr(
                lc,
                "Skriv inn e-post og passord knyttet til Vendure-kontoen.",
                "Enter the email and password for your storefront account.",
              )
            : undefined
        }
        crumbs={[{ label: isLogin ? tr(lc, "Logg inn", "Sign in") : tr(lc, "Registrer", "Register") }]}
        bgImage={heroImg}
        locale={lc}
      />
      <section className="container-x section-pad max-w-xl">
        <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
          <AuthTabs active={initialTab} />
          {isLogin ? (
            <Suspense fallback={<p className="text-center text-[14px] text-[var(--color-muted)]">{tr(lc, "Laster …", "Loading…")}</p>}>
              <LoginPanel />
            </Suspense>
          ) : (
            <RegisterPanel />
          )}
        </div>
      </section>
      <Footer locale={lc} />
    </main>
  );
}

export function AccountAuthView({
  megaMenuByLocale = EMPTY_MEGA,
  initialTab,
}: {
  megaMenuByLocale?: MegaMenuLocales;
  initialTab: AuthTab;
}) {
  return <AccountAuthContent megaMenuByLocale={megaMenuByLocale} initialTab={initialTab} />;
}
