import {
  DEFAULT_PHONE_COUNTRY_ISO,
  getPhoneCountry,
  PHONE_COUNTRIES,
} from "@/lib/phone/country-codes";

const DIAL_MATCH_ORDER = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

export type ParsedPhone = {
  countryIso: string;
  nationalNumber: string;
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Split stored phone digits into country + national number. */
export function parseStoredPhone(value: string, defaultCountryIso = DEFAULT_PHONE_COUNTRY_ISO): ParsedPhone {
  const digits = digitsOnly(value);
  if (!digits) {
    return { countryIso: defaultCountryIso, nationalNumber: "" };
  }

  for (const country of DIAL_MATCH_ORDER) {
    if (digits.startsWith(country.dialCode) && digits.length > country.dialCode.length) {
      return {
        countryIso: country.iso,
        nationalNumber: digits.slice(country.dialCode.length),
      };
    }
  }

  if (digits.startsWith("0")) {
    return { countryIso: defaultCountryIso, nationalNumber: digits.slice(1) };
  }

  return { countryIso: defaultCountryIso, nationalNumber: digits };
}

/** Build digits-only storage value: dial code + national number (no leading 0). */
export function buildStoredPhone(countryIso: string, nationalNumber: string): string {
  const national = digitsOnly(nationalNumber).replace(/^0+/, "");
  if (!national) return "";
  const dialCode = getPhoneCountry(countryIso).dialCode;
  return `${dialCode}${national}`;
}
