import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

export function emailAlreadyRegisteredMessage(locale: Locale | string): string {
  return tr(locale as Locale, "E-posten er allerede registrert.", "Email already registered.");
}

export function emailNotRegisteredMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Denne e-posten er ikke registrert.", "This email is not registered.");
}

export function incorrectPasswordMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Feil passord.", "Incorrect password.");
}

export function invalidEmailFormatMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Ugyldig e-postformat.", "Invalid email format.");
}

export function invalidOtpMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Angi en gyldig 6-sifret kode.", "Please enter a valid 6-digit code.");
}

export function passwordsDoNotMatchMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Passordene stemmer ikke overens.", "Passwords do not match.");
}

export function loginFailedMessage(locale: Locale | string): string {
  return tr(
    locale as Locale,
    "Ugyldig e-post eller passord.",
    "Invalid email or password.",
  );
}
