import { tr } from "@/lib/locale";
import type { Locale } from "@/lib/locale";

/**
 * Basic password rules for checkout and registration: minimum length only.
 */
export function validatePasswordBasic(password: string, locale: Locale | string): string | null {
  const l = locale as Locale;
  if (password.length < 8) {
    return tr(l, "Passordet må være minst 8 tegn.", "Password must be at least 8 characters.");
  }
  return null;
}

/**
 * Strong password rules (account password change, forgot-password reset).
 */
export function validatePasswordComplexity(password: string, locale: Locale | string): string | null {
  const l = locale as Locale;
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push(tr(l, "Passordet må være minst 8 tegn.", "Password must be at least 8 characters."));
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    errors.push(
      tr(
        l,
        "Passordet må inneholde stor og liten bokstav, tall og spesialtegn.",
        "Password must include uppercase, lowercase, number and special character.",
      )
    );
  }

  return errors.length > 0 ? errors.join("\n") : null;
}
