import { passwordsDoNotMatchMessage } from "@/lib/auth/auth-messages";
import { validatePasswordComplexity } from "@/lib/auth/validate";
import { CHECKOUT_ALLOWED_COUNTRY_CODES } from "@/lib/checkout/countries";
import { pickLocale, tr, type Locale } from "@/lib/locale";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutFieldErrors = Partial<Record<string, string>>;

export type CheckoutFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  orgNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  consent: boolean;
  password: string;
  confirmPassword: string;
};

export type ValidateCheckoutOptions = {
  /** Signed-in shoppers: no password step; `setCustomerForOrder` is skipped server-side. */
  skipPassword?: boolean;
  locale?: string;
};

/** Returns field-level validation errors keyed by logical field names (matching form data keys where possible). */
export function validateCheckoutForm(values: CheckoutFormValues, options?: ValidateCheckoutOptions): CheckoutFieldErrors {
  const errs: CheckoutFieldErrors = {};
  const skipPassword = options?.skipPassword === true;
  const lc: Locale = pickLocale(options?.locale);

  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  if (firstName.length < 2) {
    errs.firstName = tr(lc, "Fornavn må fylles ut (min. 2 tegn).", "First name is required (min. 2 characters).");
  }
  if (lastName.length < 2) {
    errs.lastName = tr(lc, "Etternavn må fylles ut (min. 2 tegn).", "Last name is required (min. 2 characters).");
  }

  const email = values.email.trim().toLowerCase();
  if (!email.length) errs.email = tr(lc, "E-post må fylles ut.", "Email is required.");
  else if (!EMAIL_RE.test(email)) errs.email = tr(lc, "Ugyldig e-postadresse.", "Invalid email address.");

  if (!skipPassword) {
    const pw = values.password.trim();
    const pwdErr = validatePasswordComplexity(pw, lc);
    if (pwdErr) {
      errs.password = pwdErr;
    }
    const cp = values.confirmPassword.trim();
    if (pw !== cp) errs.confirmPassword = passwordsDoNotMatchMessage(lc);
  }

  const phone = values.phone.trim().replace(/\s+/g, "");
  if (phone.length < 8) {
    errs.phone = tr(lc, "Telefonnummer må fylles ut (min. 8 siffer).", "Phone number is required (min. 8 digits).");
  }

  const addressLine1 = values.addressLine1.trim();
  if (addressLine1.length < 4) {
    errs.addressLine1 = tr(lc, "Adresselinje 1 må fylles ut.", "Address line 1 is required.");
  }

  const line2 = values.addressLine2.trim();
  if (line2.length > 120) {
    errs.addressLine2 = tr(lc, "Adresselinje 2 er for lang.", "Address line 2 is too long.");
  }

  const postal = values.postalCode.trim().replace(/\s+/g, " ");
  const postalDense = postal.replace(/\s+/g, "");
  if (!postalDense.length) errs.postalCode = tr(lc, "Postnummer må fylles ut.", "Postal code is required.");
  else if (postalDense.length > 16 || !/^[-A-Z0-9]+$/i.test(postalDense)) {
    errs.postalCode = tr(lc, "Ugyldig postnummer / PIN.", "Invalid postal code / PIN.");
  }

  const city = values.city.trim();
  if (city.length < 2) errs.city = tr(lc, "Poststed må fylles ut.", "City is required.");

  const state = values.state.trim();
  if (state.length < 2) {
    errs.state = tr(lc, "Delstat/fylke mangler eller er for kort.", "State / province is missing or too short.");
  }

  const country = values.countryCode.trim().toUpperCase();
  if (!country || country.length !== 2 || !CHECKOUT_ALLOWED_COUNTRY_CODES.has(country)) {
    errs.countryCode = tr(lc, "Velg gyldig land.", "Select a valid country.");
  }

  if (!values.consent) {
    errs.consent = tr(
      lc,
      "Du må bekrefte samtykket før du kan legge inn bestillingen.",
      "You must confirm consent before placing the order.",
    );
  }

  return errs;
}

export function checkoutFormHasErrors(errs: CheckoutFieldErrors): boolean {
  return Object.keys(errs).length > 0;
}
