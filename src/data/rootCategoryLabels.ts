import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

/** Root collection slugs — same targets as /produkter sidebar and footer links. */
export const ROOT_CATEGORY_LABELS = [
  { slug: "kaffe", nameNb: "Kaffemaskin og bar", nameEn: "Coffee and bar" },
  { slug: "kjolerom", nameNb: "Kjølerom og fryserom", nameEn: "Cold rooms and freezer rooms" },
  { slug: "kjoling", nameNb: "Kjøle- og frysutstyr", nameEn: "Cooling and freezing" },
  { slug: "kok-stek", nameNb: "Kok og stek", nameEn: "Cook and fry" },
  { slug: "kombi", nameNb: "Kombidampere", nameEn: "Combi ovens" },
  { slug: "maskiner", nameNb: "Kjøkkenmaskiner", nameEn: "Kitchen machinery" },
  { slug: "oppvask", nameNb: "Oppvaskmaskiner", nameEn: "Dishwashers" },
  { slug: "pizza", nameNb: "Pizzautstyr", nameEn: "Pizza equipment" },
  { slug: "rengjoring", nameNb: "Rengjøring og hygiene", nameEn: "Cleaning and hygiene" },
  { slug: "servering", nameNb: "Serveringsutstyr", nameEn: "Serving equipment" },
] as const;

const BY_SLUG = new Map<string, (typeof ROOT_CATEGORY_LABELS)[number]>(
  ROOT_CATEGORY_LABELS.map((row) => [row.slug, row]),
);

/** Storefront fallback when Vendure omits a translation for a root collection slug. */
export function rootCategoryLabelForSlug(slug: string, locale: Locale): string | null {
  const row = BY_SLUG.get(slug);
  if (!row) return null;
  return tr(locale, row.nameNb, row.nameEn);
}

export function rootCategoryLabelsForSlug(slug: string): { nameNb: string; nameEn: string } | null {
  const row = BY_SLUG.get(slug);
  if (!row) return null;
  return { nameNb: row.nameNb, nameEn: row.nameEn };
}
