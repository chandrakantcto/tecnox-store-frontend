"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { TopBar } from "@/components/site/TopBar";
import { AuthFieldGroup } from "@/components/account/AuthFieldGroup";
import { PasswordRequirementsHint } from "@/components/account/PasswordRequirementsHint";
import { TermsAcceptanceCheckbox } from "@/components/account/TermsAcceptanceCheckbox";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import {
  emailAlreadyRegisteredMessage,
  emailNotRegisteredMessage,
  incorrectPasswordMessage,
  invalidEmailFormatMessage,
  invalidPhoneNumberMessage,
  loginFailedMessage,
  requiredEmailMessage,
  requiredFirstNameMessage,
  requiredLastNameMessage,
  requiredPasswordMessage,
  termsNotAcceptedMessage,
} from "@/lib/auth/auth-messages";
import {
  isBlankInput,
  isValidEmail,
  isValidPhoneDigits,
  normalizeAuthEmail,
} from "@/lib/auth/email-validation";
import { shopLoginEmailPassword, shopRegisterAccount } from "@/lib/auth/shop-session-auth";
import { useLocale } from "@/contexts/LocaleContext";
import { tr } from "@/lib/locale";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { firstFieldError } from "@/lib/auth/field-errors";
import { validatePasswordComplexity } from "@/lib/auth/validate";
import heroImg from "@/assets/hero-combi.jpg";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

export type AuthTab = "login" | "register";

type LoginFieldKey = "email" | "password";
type RegisterFieldKey = "firstName" | "lastName" | "email" | "phone" | "password" | "terms";

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginFieldKey, string>>>({});
  const [busy, setBusy] = useState(false);

  const clearFieldError = (field: LoginFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const mapLoginApiError = (error: string): Partial<Record<LoginFieldKey, string>> => {
    if (error === emailNotRegisteredMessage(lc) || error === invalidEmailFormatMessage(lc)) {
      return { email: error };
    }
    if (error === incorrectPasswordMessage(lc) || error === loginFailedMessage(lc)) {
      return { password: error };
    }
    return { password: error };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);

    const errors = firstFieldError<LoginFieldKey>([
      {
        field: "email",
        message: isBlankInput(trimmedEmail)
          ? requiredEmailMessage(lc)
          : !isValidEmail(trimmedEmail)
            ? invalidEmailFormatMessage(lc)
            : null,
      },
      {
        field: "password",
        message: isBlankInput(password) ? requiredPasswordMessage(lc) : null,
      },
    ]);

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    let emailRegistered: boolean | null = null;
    try {
      const checkRes = await fetch("/api/auth/check-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const checkData = (await checkRes.json()) as {
        registered?: boolean;
        lookupAvailable?: boolean;
        error?: string;
      };
      if (checkData.lookupAvailable) {
        emailRegistered = checkData.registered === true;
        if (!checkData.registered) {
          setBusy(false);
          setFieldErrors({ email: emailNotRegisteredMessage(lc) });
          return;
        }
      }
    } catch {
      emailRegistered = null;
    }

    const r = await shopLoginEmailPassword(trimmedEmail, password, lc, { emailRegistered });
    setBusy(false);
    if (!r.ok) {
      setFieldErrors(mapLoginApiError(r.error));
      return;
    }
    await refresh();
    router.replace(next);
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5">
      <AuthFieldGroup
        label={tr(lc, "E-post", "Email")}
        error={fieldErrors.email}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError("email");
          }}
          onBlur={() => setEmail((v) => v.trim())}
          required
          maxLength={255}
          className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px]"
        />
      </AuthFieldGroup>
      <AuthFieldGroup
        label={
          <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            <span>{tr(lc, "Passord", "Password")}</span>
          
          </div>
        }
        error={fieldErrors.password}
      >
        <PasswordWithToggle
          value={password}
          onChange={(v) => {
            setPassword(v);
            clearFieldError("password");
          }}
          required
          autoComplete="current-password"
          maxLength={255}
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 pr-11 text-[14px]"
        />
        
      </AuthFieldGroup>
      <div className="text-right">
      <Link
              href="/forgot-password"
              className="text-[14px] normal-case tracking-normal text-[var(--color-copper)] hover:underline"
            >
              {tr(lc, "Glemt passord?", "Forgot password?")}
            </Link>
        </div>
      <button type="submit" disabled={busy} className="btn-primary cursor-pointer w-full disabled:opacity-60">
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterFieldKey, string>>>({});
  const [busy, setBusy] = useState(false);

  const clearFieldError = (field: RegisterFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const collectFieldErrors = (): Partial<Record<RegisterFieldKey, string>> => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const pwdErr = isBlankInput(password) ? null : validatePasswordComplexity(password, lc);

    return firstFieldError<RegisterFieldKey>([
      { field: "firstName", message: isBlankInput(trimmedFirst) ? requiredFirstNameMessage(lc) : null },
      { field: "lastName", message: isBlankInput(trimmedLast) ? requiredLastNameMessage(lc) : null },
      {
        field: "email",
        message: isBlankInput(trimmedEmail)
          ? requiredEmailMessage(lc)
          : !isValidEmail(trimmedEmail)
            ? invalidEmailFormatMessage(lc)
            : null,
      },
      { field: "phone", message: !isValidPhoneDigits(trimmedPhone) ? invalidPhoneNumberMessage(lc) : null },
      {
        field: "password",
        message: isBlankInput(password) ? requiredPasswordMessage(lc) : pwdErr,
      },
      { field: "terms", message: !termsAccepted ? termsNotAcceptedMessage(lc) : null },
    ]);
  };

  const mapRegisterApiError = (error: string): Partial<Record<RegisterFieldKey, string>> => {
    if (error === emailAlreadyRegisteredMessage(lc)) return { email: error };
    return { email: error };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = normalizeAuthEmail(email);
    const trimmedPhone = phone.trim();

    setFirstName(trimmedFirst);
    setLastName(trimmedLast);
    setEmail(trimmedEmail);
    setPhone(trimmedPhone);

    const errors = collectFieldErrors();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);

    try {
      const checkRes = await fetch("/api/auth/check-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const checkData = (await checkRes.json()) as {
        registered?: boolean;
        lookupAvailable?: boolean;
      };
      if (checkData.lookupAvailable && checkData.registered) {
        setBusy(false);
        setFieldErrors({ email: emailAlreadyRegisteredMessage(lc) });
        return;
      }
    } catch {
      // Proceed when lookup is unavailable; Vendure may still reject duplicates.
    }

    const r = await shopRegisterAccount(
      {
        email: trimmedEmail,
        password,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phoneNumber: trimmedPhone || undefined,
      },
      lc,
    );
    if (!r.ok) {
      setBusy(false);
      setFieldErrors(mapRegisterApiError(r.error));
      return;
    }

    try {
      await fetch("/api/auth/send-registration-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: trimmedFirst,
          lastName: trimmedLast,
          email: trimmedEmail,
          locale: lc,
        }),
      });
    } catch {
      // Registration succeeded; email failure should not block account access.
    }

    setBusy(false);
    await refresh();
    router.replace("/");
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <RegisterField
          label={tr(lc, "Fornavn", "First name")}
          value={firstName}
          error={fieldErrors.firstName}
          onChange={(v) => {
            setFirstName(v);
            clearFieldError("firstName");
          }}
          onBlurTrim
          required
          maxLength={100}
        />
        <RegisterField
          label={tr(lc, "Etternavn", "Last name")}
          value={lastName}
          error={fieldErrors.lastName}
          onChange={(v) => {
            setLastName(v);
            clearFieldError("lastName");
          }}
          onBlurTrim
          required
          maxLength={100}
        />
      </div>
      <RegisterField
        label={tr(lc, "E-post", "Email")}
        type="email"
        value={email}
        error={fieldErrors.email}
        onChange={(v) => {
          setEmail(v);
          clearFieldError("email");
        }}
        onBlurTrim
        required
        maxLength={255}
      />
      <AuthFieldGroup
        label={tr(lc, "Telefon (valgfritt)", "Phone (optional)")}
        error={fieldErrors.phone}
        labelClassName="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)] sm:col-span-1"
      >
        <PhoneInputWithCountry
          value={phone}
          onChange={(v) => {
            setPhone(v);
            clearFieldError("phone");
          }}
          hasError={Boolean(fieldErrors.phone)}
          className="mt-2"
        />
      </AuthFieldGroup>
      <div>
        <RegisterField
          label={tr(lc, "Passord", "Password")}
          type="password"
          value={password}
          error={fieldErrors.password}
          onChange={(v) => {
            setPassword(v);
            clearFieldError("password");
          }}
          required
          maxLength={255}
        />
        <PasswordRequirementsHint />
      </div>
      <AuthFieldGroup error={fieldErrors.terms}>
        <TermsAcceptanceCheckbox
          checked={termsAccepted}
          onChange={(v) => {
            setTermsAccepted(v);
            clearFieldError("terms");
          }}
        />
      </AuthFieldGroup>
      <button type="submit" disabled={busy} className="btn-primary cursor-pointer w-full disabled:opacity-60">
        {busy ? tr(lc, "Oppretter …", "Creating …") : tr(lc, "Registrer", "Register")}
      </button>
    </form>
  );
}

function RegisterField({
  label,
  value,
  onChange,
  error,
  type = "text",
  required,
  maxLength,
  onBlurTrim,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  type?: string;
  required?: boolean;
  maxLength?: number;
  onBlurTrim?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { locale: lc } = useLocale();
  const baseInputClass = "mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px]";
  return (
    <AuthFieldGroup label={label} error={error} labelClassName="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)] sm:col-span-1">
      {type === "password" ? (
        <PasswordWithToggle
          value={value}
          onChange={onChange}
          required={required}
          maxLength={maxLength}
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
          maxLength={maxLength}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlurTrim ? () => onChange(value.trim()) : undefined}
          className={baseInputClass}
        />
      )}
    </AuthFieldGroup>
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
