import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";

export type PhoneCountry = {
  iso: string;
  nameNb: string;
  nameEn: string;
  dialCode: string;
};

export const DEFAULT_PHONE_COUNTRY_ISO = "NO";

function buildPhoneCountries(): PhoneCountry[] {
  const enNames = new Intl.DisplayNames(["en"], { type: "region" });
  const nbNames = new Intl.DisplayNames(["nb"], { type: "region" });

  return getCountries()
    .map((iso) => {
      const code = iso as CountryCode;
      return {
        iso,
        nameEn: enNames.of(iso) ?? iso,
        nameNb: nbNames.of(iso) ?? iso,
        dialCode: getCountryCallingCode(code),
      };
    })
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn, "en"));
}

export const PHONE_COUNTRIES: PhoneCountry[] = buildPhoneCountries();

const BY_ISO = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));

export function getPhoneCountry(iso: string): PhoneCountry {
  return BY_ISO.get(iso.toUpperCase()) ?? BY_ISO.get(DEFAULT_PHONE_COUNTRY_ISO)!;
}

export function flagEmoji(iso: string): string {
  const code = iso.toUpperCase();
  if (code.length !== 2) return "";
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

export function phoneCountryLabel(entry: PhoneCountry, locale: "nb" | "en"): string {
  return locale === "en" ? entry.nameEn : entry.nameNb;
}
