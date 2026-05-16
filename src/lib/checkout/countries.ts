/** Keep `code` values aligned with `STOREFRONT_CHECKOUT_COUNTRIES` in `backend/src/plugins/storefront-checkout-countries.ts`. */
export type CheckoutCountry = { code: string; nb: string; en: string };

export const CHECKOUT_COUNTRIES: CheckoutCountry[] = [
  { code: "NO", nb: "Norge", en: "Norway" },
  { code: "SE", nb: "Sverige", en: "Sweden" },
  { code: "DK", nb: "Danmark", en: "Denmark" },
  { code: "FI", nb: "Finland", en: "Finland" },
  { code: "IS", nb: "Island", en: "Iceland" },
  { code: "GB", nb: "Storbritannia", en: "United Kingdom" },
  { code: "IE", nb: "Irland", en: "Ireland" },
  { code: "DE", nb: "Tyskland", en: "Germany" },
  { code: "NL", nb: "Nederland", en: "Netherlands" },
  { code: "BE", nb: "Belgia", en: "Belgium" },
  { code: "FR", nb: "Frankrike", en: "France" },
  { code: "ES", nb: "Spania", en: "Spain" },
  { code: "IT", nb: "Italia", en: "Italy" },
  { code: "PL", nb: "Polen", en: "Poland" },
  { code: "AT", nb: "Østerrike", en: "Austria" },
  { code: "CH", nb: "Sveits", en: "Switzerland" },
  { code: "PT", nb: "Portugal", en: "Portugal" },
  { code: "GR", nb: "Hellas", en: "Greece" },
  { code: "US", nb: "USA", en: "United States" },
  { code: "CA", nb: "Canada", en: "Canada" },
  { code: "AU", nb: "Australia", en: "Australia" },
  { code: "NZ", nb: "New Zealand", en: "New Zealand" },
  { code: "IN", nb: "India", en: "India" },
];

export const CHECKOUT_ALLOWED_COUNTRY_CODES = new Set(CHECKOUT_COUNTRIES.map((c) => c.code));

export function labelForCheckoutCountry(lc: string, nb: string, en: string): string {
  return lc === "en" ? en : nb;
}
