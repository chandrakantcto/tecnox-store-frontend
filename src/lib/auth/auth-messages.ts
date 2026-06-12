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

export function passwordRequirementsMessage(locale: Locale | string): string {
  return tr(
    locale as Locale,
    "Passord må være minst 8 tegn med stor og liten bokstav, tall og spesialtegn.",
    "Password must be 8+ characters with uppercase, lowercase, number, and special character.",
  );
}

export function termsNotAcceptedMessage(locale: Locale | string): string {
  return tr(
    locale as Locale,
    "Du må godta vilkårene og personvernerklæringen.",
    "You must accept the Terms & Conditions and Privacy Policy.",
  );
}

export function invalidPhoneNumberMessage(locale: Locale | string): string {
  return tr(
    locale as Locale,
    "Telefonnummer kan kun inneholde tall.",
    "Phone number can only contain numbers.",
  );
}

export function requiredFirstNameMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Fornavn er påkrevd.", "First name is required.");
}

export function requiredLastNameMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Etternavn er påkrevd.", "Last name is required.");
}

export function requiredEmailMessage(locale: Locale | string): string {
  return tr(locale as Locale, "E-post er påkrevd.", "Email is required.");
}

export function requiredPasswordMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Passord er påkrevd.", "Password is required.");
}

export function requiredCurrentPasswordMessage(locale: Locale | string): string {
  return tr(locale as Locale, "Nåværende passord er påkrevd.", "Current password is required.");
}
