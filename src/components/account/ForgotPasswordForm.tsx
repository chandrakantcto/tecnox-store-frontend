"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFieldGroup } from "@/components/account/AuthFieldGroup";
import { PasswordRequirementsHint } from "@/components/account/PasswordRequirementsHint";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";
import {
  emailNotRegisteredMessage,
  invalidEmailFormatMessage,
  invalidOtpMessage,
  passwordsDoNotMatchMessage,
  requiredEmailMessage,
  requiredPasswordMessage,
} from "@/lib/auth/auth-messages";
import { isBlankInput, isValidEmail, normalizeAuthEmail } from "@/lib/auth/email-validation";
import { OTP_VALIDITY_SECONDS } from "@/lib/auth/otp-store";
import { allFieldErrors, firstFieldError } from "@/lib/auth/field-errors";
import { validatePasswordComplexity } from "@/lib/auth/validate";
import { useLocale } from "@/contexts/LocaleContext";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { shopLoginEmailPassword } from "@/lib/auth/shop-session-auth";
import { tr } from "@/lib/locale";

type Step = "email" | "otp" | "reset";
type ForgotFieldKey = "email" | "otp" | "password" | "confirmPassword";

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ForgotFieldKey, string>>>({});
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
    setFieldErrors({});
    setInfo(null);
    setDevOtp("");

    const trimmedEmail = normalizeAuthEmail(email);
    setEmail(trimmedEmail);

    if (isBlankInput(trimmedEmail)) {
      setFieldErrors({ email: requiredEmailMessage(lc) });
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setFieldErrors({ email: invalidEmailFormatMessage(lc) });
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
      if (!checkData.lookupAvailable) {
        setFieldErrors({
          email: tr(
            lc,
            "Kunne ikke verifisere e-post. Prøv igjen senere.",
            "Could not verify email. Please try again later.",
          ),
        });
        return;
      }
      if (!checkData.registered) {
        setFieldErrors({ email: emailNotRegisteredMessage(lc) });
        return;
      }

      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, locale: lc }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; emailSent?: boolean; devOtp?: string };

      if (!data.success) {
        if (data.error === "email_not_registered") {
          setFieldErrors({ email: emailNotRegisteredMessage(lc) });
        } else if (data.error === "invalid_email") {
          setFieldErrors({ email: invalidEmailFormatMessage(lc) });
        } else {
          setFieldErrors({ email: tr(lc, "Kunne ikke sende kode. Prøv igjen.", "Could not send code. Please try again.") });
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
      setFieldErrors({ email: tr(lc, "Kunne ikke sende kode. Prøv igjen.", "Could not send code. Please try again.") });
    } finally {
      setBusy(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setFieldErrors((prev) => {
      if (!prev.otp) return prev;
      const nextErrors = { ...prev };
      delete nextErrors.otp;
      return nextErrors;
    });
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
      setFieldErrors((prev) => {
        if (!prev.otp) return prev;
        const nextErrors = { ...prev };
        delete nextErrors.otp;
        return nextErrors;
      });
      e.preventDefault();
      return;
    }
    if (index > 0) {
      const next = [...otpDigits];
      next[index - 1] = "";
      setOtpDigits(next);
      setFieldErrors((prev) => {
        if (!prev.otp) return prev;
        const nextErrors = { ...prev };
        delete nextErrors.otp;
        return nextErrors;
      });
      document.getElementById(`otp-${index - 1}`)?.focus();
      e.preventDefault();
    }
  };

  const handleResendOtp = async () => {
    const trimmedEmail = normalizeAuthEmail(email);
    if (busy || !trimmedEmail) return;
    setFieldErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, locale: lc }),
      });
      const data = (await res.json()) as { success?: boolean; devOtp?: string };
      if (!data.success) {
        setFieldErrors({ otp: tr(lc, "Kunne ikke sende kode på nytt.", "Could not resend code.") });
        return;
      }
      if (data.devOtp) setDevOtp(String(data.devOtp));
      setOtpDigits(["", "", "", "", "", ""]);
      startOtpExpiryTimer();
      document.getElementById("otp-0")?.focus();
    } catch {
      setFieldErrors({ otp: tr(lc, "Kunne ikke sende kode på nytt.", "Could not resend code.") });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (otp.length !== 6) {
      setFieldErrors({ otp: invalidOtpMessage(lc) });
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
        setFieldErrors({ otp: invalidOtpMessage(lc) });
        return;
      }
      setInfo(null);
      setStep("reset");
    } catch {
      setFieldErrors({ otp: invalidOtpMessage(lc) });
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setInfo(null);

    const pwdErr = isBlankInput(password) ? null : validatePasswordComplexity(password, lc);
    const errors = allFieldErrors<ForgotFieldKey>([
      {
        field: "password",
        message: isBlankInput(password) ? requiredPasswordMessage(lc) : pwdErr,
      },
      {
        field: "confirmPassword",
        message: password !== confirmPassword ? passwordsDoNotMatchMessage(lc) : null,
      },
    ]);

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const trimmedEmail = normalizeAuthEmail(email);

    setBusy(true);
    try {
      const res = await fetch("/api/auth/complete-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, otp, password, locale: lc }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!data.success) {
        setFieldErrors({
          password: data.message ?? tr(lc, "Kunne ikke tilbakestille passord.", "Could not reset password."),
        });
        return;
      }

      const login = await shopLoginEmailPassword(trimmedEmail, password, lc);
      if (!login.ok) {
        setFieldErrors({
          password: tr(
            lc,
            "Passordet er oppdatert, men automatisk innlogging mislyktes. Prøv å logge inn manuelt.",
            "Password updated, but automatic sign-in failed. Please sign in manually.",
          ),
        });
        return;
      }
      await refresh();
      router.replace("/");
    } catch {
      setFieldErrors({ password: tr(lc, "Kunne ikke tilbakestille passord.", "Could not reset password.") });
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
        <form onSubmit={(e) => void handleResetPassword(e)} noValidate className="space-y-5">
          <div>
            <AuthFieldGroup
              label={tr(lc, "Nytt passord", "New password")}
              error={fieldErrors.password}
            >
              <PasswordWithToggle
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  setFieldErrors((prev) => {
                    if (!prev.password) return prev;
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }}
                required
                autoComplete="new-password"
                showLabel={tr(lc, "Vis passord", "Show password")}
                hideLabel={tr(lc, "Skjul passord", "Hide password")}
                className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 pr-11 text-[14px]"
              />
            </AuthFieldGroup>
            <PasswordRequirementsHint />
          </div>
          <AuthFieldGroup
            label={tr(lc, "Gjenta passord", "Confirm password")}
            error={fieldErrors.confirmPassword}
          >
            <PasswordWithToggle
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                setFieldErrors((prev) => {
                  if (!prev.confirmPassword) return prev;
                  const next = { ...prev };
                  delete next.confirmPassword;
                  return next;
                });
              }}
              required
              autoComplete="new-password"
              showLabel={tr(lc, "Vis passord", "Show password")}
              hideLabel={tr(lc, "Skjul passord", "Hide password")}
              className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 pr-11 text-[14px]"
            />
          </AuthFieldGroup>
          <button type="submit" disabled={busy} className="btn-primary cursor-pointer w-full disabled:opacity-60">
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
          {tr(lc, "Skriv inn den 6-sifrede koden fra ", "Enter the 6-digit code from your ")}{" "}
          <span className="font-semibold text-[var(--color-copper)]">{email}</span>.
        </p>
        {devOtp ? (
          <p className="mb-4 rounded-[2px] bg-amber-50 px-3 py-2 font-mono text-[12px] text-amber-900">Dev OTP: {devOtp}</p>
        ) : null}
        <form onSubmit={(e) => void handleVerifyOtp(e)} noValidate className="space-y-5">
          <AuthFieldGroup error={fieldErrors.otp}>
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
          </AuthFieldGroup>
          <button type="submit" disabled={busy} className="btn-primary cursor-pointer w-full disabled:opacity-60">
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
          <button type="button" onClick={() => { setStep("email"); setOtpDigits(["", "", "", "", "", ""]); setFieldErrors({}); }} className="text-[14px] text-[var(--color-copper)] hover:underline">
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
      {info ? <p className="mb-4 text-[13px] text-[var(--color-muted)]">{info}</p> : null}
      <form onSubmit={(e) => void handleSendOtp(e)} noValidate className="space-y-5">
        <AuthFieldGroup
          label={tr(lc, "E-post", "Email")}
          error={fieldErrors.email}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => {
                if (!prev.email) return prev;
                const next = { ...prev };
                delete next.email;
                return next;
              });
            }}
            onBlur={() => setEmail((v) => v.trim())}
            placeholder={tr(lc, "Skriv inn e-post", "Enter your email")}
            className="mt-2 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-3 text-[14px] focus:border-[var(--color-copper)] focus:outline-none"
          />
        </AuthFieldGroup>
        <button type="submit" disabled={busy} className="btn-primary cursor-pointer w-full disabled:opacity-60">
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
