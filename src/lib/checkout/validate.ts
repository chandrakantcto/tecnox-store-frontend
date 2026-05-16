import { CHECKOUT_ALLOWED_COUNTRY_CODES } from "@/lib/checkout/countries";

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
};

/** Returns field-level validation errors keyed by logical field names (matching form data keys where possible). */
export function validateCheckoutForm(values: CheckoutFormValues, options?: ValidateCheckoutOptions): CheckoutFieldErrors {
  const errs: CheckoutFieldErrors = {};
  const skipPassword = options?.skipPassword === true;

  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  if (firstName.length < 2) errs.firstName = "Fornavn må fylles ut (min. 2 tegn).";
  if (lastName.length < 2) errs.lastName = "Etternavn må fylles ut (min. 2 tegn).";

  const email = values.email.trim().toLowerCase();
  if (!email.length) errs.email = "E-post må fylles ut.";
  else if (!EMAIL_RE.test(email)) errs.email = "Ugyldig e-postadresse.";

  if (!skipPassword) {
    const pw = values.password.trim();
    if (pw.length < 8) errs.password = "Passord må være minst 8 tegn.";
    const cp = values.confirmPassword.trim();
    if (pw !== cp) errs.confirmPassword = "Passordene er ikke like.";
  }

  const phone = values.phone.trim().replace(/\s+/g, "");
  if (phone.length < 8) errs.phone = "Telefonnummer må fylles ut (min. 8 siffer).";

  const addressLine1 = values.addressLine1.trim();
  if (addressLine1.length < 4) errs.addressLine1 = "Adresselinje 1 må fylles ut.";

  const line2 = values.addressLine2.trim();
  if (line2.length > 120) errs.addressLine2 = "Adresselinje 2 er for lang.";

  const postal = values.postalCode.trim().replace(/\s+/g, " ");
  const postalDense = postal.replace(/\s+/g, "");
  if (!postalDense.length) errs.postalCode = "Postnummer må fylles ut.";
  else if (postalDense.length > 16 || !/^[-A-Z0-9]+$/i.test(postalDense)) {
    errs.postalCode = "Ugyldig postnummer / PIN.";
  }

  const city = values.city.trim();
  if (city.length < 2) errs.city = "Poststed må fylles ut.";

  const state = values.state.trim();
  if (state.length < 2) errs.state = "Delstat/fylke mangler eller er for kort.";

  const country = values.countryCode.trim().toUpperCase();
  if (!country || country.length !== 2 || !CHECKOUT_ALLOWED_COUNTRY_CODES.has(country)) {
    errs.countryCode = "Velg gyldig land.";
  }

  if (!values.consent) errs.consent = "Du må bekrefte samtykket før du kan legge inn bestillingen.";

  return errs;
}

export function checkoutFormHasErrors(errs: CheckoutFieldErrors): boolean {
  return Object.keys(errs).length > 0;
}
