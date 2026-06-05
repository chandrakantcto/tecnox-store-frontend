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
  if (password.length < 8) {
    return tr(locale, "Passord må være minst 8 tegn.", "Password must be at least 8 characters.");
  }
  if (!/[A-Z]/.test(password)) {
    return tr(locale, "Passordet må inneholde minst én stor bokstav.", "Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    return tr(locale, "Passordet må inneholde minst én liten bokstav.", "Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    return tr(locale, "Passordet må inneholde minst ett tall.", "Password must contain at least one number.");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return tr(locale, "Passordet må inneholde minst ett spesialtegn.", "Password must contain at least one special character.");
  }
  return null;
}
