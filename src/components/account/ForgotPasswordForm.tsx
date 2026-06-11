"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthValidationAlert } from "@/components/account/AuthValidationAlert";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";
import {
  emailNotRegisteredMessage,
  invalidEmailFormatMessage,
  invalidOtpMessage,
  passwordsDoNotMatchMessage,
} from "@/lib/auth/auth-messages";
import { isValidEmail } from "@/lib/auth/email-validation";
import { OTP_VALIDITY_SECONDS } from "@/lib/auth/otp-store";
import { validatePasswordComplexity } from "@/lib/auth/validate";
import { useLocale } from "@/contexts/LocaleContext";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { shopLoginEmailPassword } from "@/lib/auth/shop-session-auth";
import { tr } from "@/lib/locale";

type Step = "email" | "otp" | "reset";

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function ForgotPasswordForm() {
  const { locale: lc } = useLocale();
  const router = useRouter();
  const { refresh } = useShopAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [otpExpiresSecondsLeft, setOtpExpiresSecondsLeft] = useState(0);

  const otp = otpDigits.join("");

  useEffect(() => {
    if (otpExpiresSecondsLeft <= 0) return;
    const timerId = window.setTimeout(() => {
      setOtpExpiresSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [otpExpiresSecondsLeft]);

  const startOtpExpiryTimer = () => setOtpExpiresSecondsLeft(OTP_VALIDITY_SECONDS);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setDevOtp("");

    if (!isValidEmail(email)) {
      setError(invalidEmailFormatMessage(lc));
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale: lc }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; emailSent?: boolean; devOtp?: string };

      if (!data.success) {
        if (data.error === "email_not_registered") {
          setError(emailNotRegisteredMessage(lc));
        } else if (data.error === "invalid_email") {
          setError(invalidEmailFormatMessage(lc));
        } else {
          setError(tr(lc, "Kunne ikke sende kode. Prøv igjen.", "Could not send code. Please try again."));
        }
        return;
      }

      if (data.devOtp) setDevOtp(String(data.devOtp));
      setInfo(
        data.emailSent
          ? tr(lc, "Vi har sendt en 6-sifret kode til e-posten din.", "We sent a 6-digit code to your email.")
          : tr(lc, "Kode opprettet (SMTP ikke konfigurert i dev).", "Code created (SMTP not configured in dev)."),
      );
      setStep("otp");
      startOtpExpiryTimer();
    } catch {
      setError(tr(lc, "Kunne ikke sende kode. Prøv igjen.", "Could not send code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setError(null);
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace") return;
    if (otpDigits[index]) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      setError(null);
      e.preventDefault();
      return;
    }
    if (index > 0) {
      const next = [...otpDigits];
      next[index - 1] = "";
      setOtpDigits(next);
      setError(null);
      document.getElementById(`otp-${index - 1}`)?.focus();
      e.preventDefault();
    }
  };

  const handleResendOtp = async () => {
    if (busy || !email) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale: lc }),
      });
      const data = (await res.json()) as { success?: boolean; devOtp?: string };
      if (!data.success) {
        setError(tr(lc, "Kunne ikke sende kode på nytt.", "Could not resend code."));
        return;
      }
      if (data.devOtp) setDevOtp(String(data.devOtp));
      setOtpDigits(["", "", "", "", "", ""]);
      startOtpExpiryTimer();
      document.getElementById("otp-0")?.focus();
    } catch {
      setError(tr(lc, "Kunne ikke sende kode på nytt.", "Could not resend code."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError(invalidOtpMessage(lc));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!data.success) {
        setError(invalidOtpMessage(lc));
        return;
      }
      setInfo(null);
      setStep("reset");
    } catch {
      setError(invalidOtpMessage(lc));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const pwdErr = validatePasswordComplexity(password, lc);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (password !== confirmPassword) {
      setError(passwordsDoNotMatchMessage(lc));
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/complete-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password, locale: lc }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!data.success) {
        setError(data.message ?? tr(lc, "Kunne ikke tilbakestille passord.", "Could not reset password."));
        return;
      }

      const login = await shopLoginEmailPassword(email, password, lc);
      if (!login.ok) {
        setError(
          tr(
            lc,
            "Passordet er oppdatert, men automatisk innlogging mislyktes. Prøv å logge inn manuelt.",
            "Password updated, but automatic sign-in failed. Please sign in manually.",
          ),
        );
        return;
      }
      await refresh();
      router.replace("/");
    } catch {
      setError(tr(lc, "Kunne ikke tilbakestille passord.", "Could not reset password."));
    } finally {
      setBusy(false);
    }
  };

  if (step === "reset") {
    return (
      <div>
        <h2 className="mb-2 text-[20px] font-bold text-[var(--color-ink)]">
          {tr(lc, "Nytt passord", "New password")}
        </h2>
        <p className="mb-6 text-[14px] text-[var(--color-muted)]">
          {tr(lc, "Velg et nytt passord for kontoen din.", "Choose a new password for your account.")}
        </p>
        {error ? <div className="mb-4"><AuthValidationAlert>{error}</AuthValidationAlert></div> : null}
        <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-5">
          <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {tr(lc, "Nytt passord", "New password")}
            <PasswordWithToggle
              value={password}
              onChange={setPassword}
              required
              autoComplete="new-password"
              showLabel={tr(lc, "Vis passord", "Show password")}
              hideLabel={tr(lc, "Skjul passord", "Hide password")}
              className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 pr-11 text-[14px]"
            />
          </label>
          <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {tr(lc, "Gjenta passord", "Confirm password")}
            <PasswordWithToggle
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              autoComplete="new-password"
              showLabel={tr(lc, "Vis passord", "Show password")}
              hideLabel={tr(lc, "Skjul passord", "Hide password")}
              className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 pr-11 text-[14px]"
            />
          </label>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? tr(lc, "Lagrer …", "Saving …") : tr(lc, "Oppdater passord", "Update password")}
          </button>
        </form>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div>
        <h2 className="mb-2 text-[20px] font-bold text-[var(--color-ink)]">
          {tr(lc, "Glemt passord", "Forgot Password")}
        </h2>
        <p className="mb-6 text-[14px] text-[var(--color-muted)]">
          {tr(lc, "Skriv inn den 6-sifrede koden fra e-posten.", "Enter the 6-digit code from your email.")}
        </p>
        {devOtp ? (
          <p className="mb-4 rounded-[2px] bg-amber-50 px-3 py-2 font-mono text-[12px] text-amber-900">Dev OTP: {devOtp}</p>
        ) : null}
        <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-5">
          <div className="flex justify-between gap-2">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="h-12 w-11 rounded-[2px] border border-[var(--color-divider)] text-center text-lg font-bold focus:border-[var(--color-copper)] focus:outline-none"
              />
            ))}
          </div>
          {error ? <AuthValidationAlert>{error}</AuthValidationAlert> : null}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? tr(lc, "Verifiserer …", "Verifying …") : tr(lc, "Verifiser kode", "Verify code")}
          </button>
          <div className="flex items-center justify-between gap-4 text-[12px] text-[var(--color-muted)]">
            <p>
              {tr(lc, "Koden er gyldig i", "Code valid for")}{" "}
              <span className="font-bold tabular-nums text-[var(--color-copper)]">{formatTimer(otpExpiresSecondsLeft)}</span>
            </p>
            <button type="button" onClick={() => void handleResendOtp()} disabled={busy} className="text-[var(--color-copper)] font-semibold hover:underline disabled:opacity-60">
              {tr(lc, "Send på nytt", "Resend code")}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center">
          <button type="button" onClick={() => { setStep("email"); setOtpDigits(["", "", "", "", "", ""]); setError(null); }} className="text-[14px] text-[var(--color-copper)] hover:underline">
            ← {tr(lc, "Tilbake", "Back")}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-[20px] font-bold text-[var(--color-ink)]">
        {tr(lc, "Glemt passord", "Forgot Password")}
      </h2>
      <p className="mb-6 text-[14px] text-[var(--color-muted)]">
        {tr(lc, "Skriv inn e-postadressen din for å tilbakestille passordet.", "Enter your email address to reset your password.")}
      </p>
      {error ? <div className="mb-4"><AuthValidationAlert>{error}</AuthValidationAlert></div> : null}
      {info ? <p className="mb-4 text-[13px] text-[var(--color-muted)]">{info}</p> : null}
      <form onSubmit={(e) => void handleSendOtp(e)} className="space-y-5">
        <label className="block text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          {tr(lc, "E-post", "Email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tr(lc, "Skriv inn e-post", "Enter your email")}
            className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px] focus:border-[var(--color-copper)] focus:outline-none"
          />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? tr(lc, "Sender …", "Sending …") : tr(lc, "Send kode", "Send code")}
        </button>
      </form>
      <p className="mt-6 text-center text-[14px] text-[var(--color-muted)]">
        <Link href="/logg-inn" className="text-[var(--color-copper)] hover:underline">
          {tr(lc, "Tilbake til innlogging", "Back to login")}
        </Link>
      </p>
    </div>
  );
}
