import { tr } from "@/lib/locale";
import type { Locale } from "@/lib/locale";

/**
 * Validates a password for complexity requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * Returns an error message if invalid, or null if valid.
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
