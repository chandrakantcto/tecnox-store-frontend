import type { StaticImageData } from "next/image";
import type { Locale } from "@/lib/locale";
import prodCombi from "@/assets/prod-combi.jpg";
import prodUnderbenk from "@/assets/prod-underbenk.jpg";
import prodHetteoppvask from "@/assets/prod-hetteoppvask.jpg";
import prodPizzaovn from "@/assets/prod-pizzaovn.jpg";
import prodInduksjon from "@/assets/prod-induksjon.jpg";
import prodFryseskap from "@/assets/prod-fryseskap.jpg";
import prodKonvektomat from "@/assets/prod-konvektomat.jpg";
import prodStekebord from "@/assets/prod-stekebord.jpg";

export type Product = {
  slug: string;
  name: string;
  brand: string;
  spec: string;
  price: string;
  priceNumeric: number;
  badge?: "BESTSELGER" | "NYHET";
  category: string;
  img: string | StaticImageData;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
};

type ProductTranslation = {
  name: string;
  spec: string;
  price: string;
  category: string;
  description: string;
  highlights: string[];
  specLabels: string[];
  specValues?: string[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "kombidamper-icombi-pro-10-1-1",
    name: "Kombidamper iCombi Pro 10-1/1",
    brand: "Rational",
    spec: "10 × GN 1/1  ·  400V  ·  18,6 kW",
    price: "Fra kr 184 900 eks. MVA",
    priceNumeric: 184900,
    badge: "BESTSELGER",
    category: "Kombidamp",
    img: prodCombi,
    description:
      "Markedets mest intelligente kombidamper. Kjenner igjen produktet, justerer kokemiljøet og leverer perfekt resultat — gang etter gang. Bygget for europeisk profesjonell drift.",
    highlights: [
      "iCookingSuite — 9 driftsmoduser med automatisk tilpasning",
      "iProductionManager for parallell produksjon",
      "iCareSystem helautomatisk rengjøring",
      "Trådløs HACCP-dokumentasjon via ConnectedCooking",
    ],
    specs: [
      { label: "Kapasitet", value: "10 × GN 1/1" },
      { label: "Spenning", value: "400V 3N~" },
      { label: "Effekt", value: "18,6 kW" },
      { label: "Vannforbruk", value: "≤ 4 l/syklus" },
      { label: "Utvendige mål (B×D×H)", value: "850 × 842 × 1 014 mm" },
      { label: "Vekt", value: "127 kg" },
      { label: "Garanti", value: "2 år (utvidbart)" },
      { label: "Levering", value: "2–3 uker" },
    ],
  },
  {
    slug: "underbenkskjoler-gn-2-1",
    name: "Underbenkskjøler GN 2/1",
    brand: "Gram Commercial",
    spec: "390 L  ·  -2 til +12°C  ·  R290",
    price: "Fra kr 28 900 eks. MVA",
    priceNumeric: 28900,
    category: "Kjøling",
    img: prodUnderbenk,
    description:
      "Robust dansk konstruksjon i rustfritt stål, dimensjonert for daglig bruk i krevende miljø. Stille drift og klassens laveste energiforbruk.",
    highlights: [
      "Naturlig kuldemedium R290 — lavt klimaavtrykk",
      "Energiklasse A — 1,2 kWh/24t",
      "Selvlukkende dører med 90° stoppfunksjon",
      "Innvendig belysning og digital styring",
    ],
    specs: [
      { label: "Volum", value: "390 L" },
      { label: "Temperaturområde", value: "-2 til +12 °C" },
      { label: "Kuldemedium", value: "R290" },
      { label: "Energiklasse", value: "A" },
      { label: "Mål (B×D×H)", value: "1 360 × 700 × 850 mm" },
      { label: "Vekt", value: "98 kg" },
      { label: "Garanti", value: "3 år" },
      { label: "Levering", value: "1–2 uker" },
    ],
  },
  {
    slug: "hetteoppvasker-ae-50",
    name: "Hetteoppvasker AE-50",
    brand: "Electrolux Professional",
    spec: "60 kurver/t  ·  500×500 mm  ·  6,8 kW",
    price: "Fra kr 64 500 eks. MVA",
    priceNumeric: 64500,
    badge: "NYHET",
    category: "Oppvask",
    img: prodHetteoppvask,
    description:
      "Hettemaskinen som fjerner flaskehalsen i oppvaskstasjonen. Smart vannstyring og innebygd avløpspumpe gir konsistent vaskeresultat ved høy belastning.",
    highlights: [
      "60 kurver per time ved standardprogram",
      "Innebygget tøreffekt og avløpspumpe",
      "Energisparemodus reduserer forbruk med 20 %",
      "Touchskjerm med flerspråklig grensesnitt",
    ],
    specs: [
      { label: "Kapasitet", value: "60 kurver/time" },
      { label: "Kurvstørrelse", value: "500 × 500 mm" },
      { label: "Effekt", value: "6,8 kW" },
      { label: "Vannforbruk", value: "2,4 l/syklus" },
      { label: "Mål (B×D×H)", value: "635 × 750 × 1 510 mm" },
      { label: "Vekt", value: "104 kg" },
      { label: "Garanti", value: "2 år" },
      { label: "Levering", value: "2 uker" },
    ],
  },
  {
    slug: "pizzaovn-modular-pyralis-9",
    name: "Pizzaovn Modular Pyralis 9",
    brand: "Modular",
    spec: "9 × Ø 33 cm  ·  500°C  ·  17,5 kW",
    price: "Fra kr 92 400 eks. MVA",
    priceNumeric: 92400,
    category: "Pizza",
    img: prodPizzaovn,
    description:
      "Italiensk håndverk for autentisk napoletansk pizza. Cordieritsten og separat sone-styring gir nøyaktig kontroll på over- og undervarme.",
    highlights: [
      "9 pizzaer Ø 33 cm samtidig",
      "Cordieritstein gir perfekt bunnsteking",
      "Separat justering av topp- og bunnvarme",
      "500 °C maksimal temperatur",
    ],
    specs: [
      { label: "Kapasitet", value: "9 × Ø 33 cm" },
      { label: "Maks temperatur", value: "500 °C" },
      { label: "Effekt", value: "17,5 kW" },
      { label: "Spenning", value: "400V 3N~" },
      { label: "Mål (B×D×H)", value: "1 220 × 1 320 × 420 mm" },
      { label: "Vekt", value: "186 kg" },
      { label: "Garanti", value: "2 år" },
      { label: "Levering", value: "3–4 uker" },
    ],
  },
  {
    slug: "induksjonstopp-4-soner",
    name: "Induksjonstopp 4-soner",
    brand: "Electrolux Professional",
    spec: "4 × 5 kW  ·  400V  ·  GN-flate",
    price: "Fra kr 47 800 eks. MVA",
    priceNumeric: 47800,
    category: "Kok og stek",
    img: prodInduksjon,
    description:
      "Profesjonell induksjon med ekstrem responstid og 90 % virkningsgrad. Lukket glassflate gir hurtig rengjøring og redusert kjøkkentemperatur.",
    highlights: [
      "4 individuelt styrte soner à 5 kW",
      "Boost-funksjon for hurtig oppvarming",
      "Automatisk gryteregistrering",
      "IPX5 vannbeskyttelse",
    ],
    specs: [
      { label: "Antall soner", value: "4" },
      { label: "Effekt per sone", value: "5 kW" },
      { label: "Total effekt", value: "20 kW" },
      { label: "Spenning", value: "400V 3N~" },
      { label: "Mål (B×D×H)", value: "800 × 730 × 250 mm" },
      { label: "Vekt", value: "44 kg" },
      { label: "Garanti", value: "2 år" },
      { label: "Levering", value: "1–2 uker" },
    ],
  },
  {
    slug: "frittstaende-fryseskap",
    name: "Frittstående fryseskap",
    brand: "Gram Commercial",
    spec: "610 L  ·  -18 til -22°C  ·  R290",
    price: "Fra kr 34 200 eks. MVA",
    priceNumeric: 34200,
    category: "Kjøling",
    img: prodFryseskap,
    description:
      "Stort fryseskap med klassens laveste energiforbruk og solid konstruksjon for hardbruk. Naturlig kuldemedium og fremtidssikker styring.",
    highlights: [
      "610 liters volum — 7 hyller",
      "R290 naturlig kuldemedium",
      "Selvlukkende dør med 90° stopp",
      "Hurtig nedfrysing og alarm ved temperaturavvik",
    ],
    specs: [
      { label: "Volum", value: "610 L" },
      { label: "Temperaturområde", value: "-18 til -22 °C" },
      { label: "Kuldemedium", value: "R290" },
      { label: "Energiklasse", value: "B" },
      { label: "Mål (B×D×H)", value: "697 × 858 × 2 052 mm" },
      { label: "Vekt", value: "138 kg" },
      { label: "Garanti", value: "3 år" },
      { label: "Levering", value: "1–2 uker" },
    ],
  },
  {
    slug: "konvektomat-convovent-mini",
    name: "Konvektomat ConvoVent Mini",
    brand: "Convotherm",
    spec: "6 × GN 1/1  ·  Direkte damp  ·  10,4 kW",
    price: "Fra kr 78 600 eks. MVA",
    priceNumeric: 78600,
    badge: "BESTSELGER",
    category: "Kombidamp",
    img: prodKonvektomat,
    description:
      "Kompakt tysk kvalitet for caféer, bakerier og mindre kjøkken. Direkte dampgenerator og enkel touchstyring — uten kompromiss på resultat.",
    highlights: [
      "6 × GN 1/1 i kompakt format",
      "Direkte dampgenerator — ingen oppvarmingstid",
      "Touchskjerm med 99 forhåndsprogrammer",
      "Helautomatisk rengjøring",
    ],
    specs: [
      { label: "Kapasitet", value: "6 × GN 1/1" },
      { label: "Effekt", value: "10,4 kW" },
      { label: "Spenning", value: "400V 3N~" },
      { label: "Vannforbruk", value: "3,2 l/syklus" },
      { label: "Mål (B×D×H)", value: "875 × 791 × 786 mm" },
      { label: "Vekt", value: "108 kg" },
      { label: "Garanti", value: "2 år" },
      { label: "Levering", value: "2–3 uker" },
    ],
  },
  {
    slug: "stekebord-800-mm",
    name: "Stekebord 800 mm",
    brand: "Sirman",
    spec: "Glatt + riflet  ·  9 kW  ·  Rustfritt",
    price: "Fra kr 19 400 eks. MVA",
    priceNumeric: 19400,
    category: "Kok og stek",
    img: prodStekebord,
    description:
      "Italiensk håndverk i rustfritt stål. Tykk stekeplate for jevn varmefordeling og lang levetid — laget for kontinuerlig drift.",
    highlights: [
      "Halv glatt, halv riflet stekeflate",
      "Termostatstyrt 50–300 °C",
      "Innebygd fettoppsamler",
      "AISI 304 rustfritt stål",
    ],
    specs: [
      { label: "Stekeflate", value: "800 × 540 mm" },
      { label: "Effekt", value: "9 kW" },
      { label: "Spenning", value: "400V 3N~" },
      { label: "Temperatur", value: "50–300 °C" },
      { label: "Mål (B×D×H)", value: "800 × 700 × 290 mm" },
      { label: "Vekt", value: "62 kg" },
      { label: "Garanti", value: "2 år" },
      { label: "Levering", value: "1–2 uker" },
    ],
  },
];

const CATEGORY_EN_BY_NB: Record<string, string> = {
  "Kombidamp": "Combi ovens",
  "Kjøling": "Cooling",
  "Oppvask": "Dishwashing",
  "Pizza": "Pizza",
  "Kok og stek": "Cook and fry",
};

const PRODUCT_EN: Record<string, ProductTranslation> = {
  "kombidamper-icombi-pro-10-1-1": {
    name: "Combi Oven iCombi Pro 10-1/1",
    spec: "10 x GN 1/1  ·  400V  ·  18.6 kW",
    price: "From NOK 184,900 excl. VAT",
    category: "Combi ovens",
    description:
      "The market's most intelligent combi oven. It recognizes the product, adjusts the cooking climate, and delivers consistent results every time. Built for demanding professional operation.",
    highlights: [
      "iCookingSuite - 9 operating modes with automatic adjustment",
      "iProductionManager for parallel production",
      "iCareSystem fully automatic cleaning",
      "Wireless HACCP documentation via ConnectedCooking",
    ],
    specLabels: ["Capacity", "Voltage", "Power", "Water consumption", "External dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["10 x GN 1/1", "400V 3N~", "18.6 kW", "<= 4 l/cycle", "850 x 842 x 1,014 mm", "127 kg", "2 years (extendable)", "2-3 weeks"],
  },
  "underbenkskjoler-gn-2-1": {
    name: "Undercounter Refrigerator GN 2/1",
    spec: "390 L  ·  -2 to +12 C  ·  R290",
    price: "From NOK 28,900 excl. VAT",
    category: "Cooling",
    description:
      "Robust Danish stainless-steel construction, dimensioned for daily use in demanding environments. Quiet operation and class-leading energy efficiency.",
    highlights: [
      "Natural refrigerant R290 - low climate footprint",
      "Energy class A - 1.2 kWh/24h",
      "Self-closing doors with 90 degree stop",
      "Interior lighting and digital control",
    ],
    specLabels: ["Volume", "Temperature range", "Refrigerant", "Energy class", "Dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["390 L", "-2 to +12 C", "R290", "A", "1,360 x 700 x 850 mm", "98 kg", "3 years", "1-2 weeks"],
  },
  "hetteoppvasker-ae-50": {
    name: "Hood Dishwasher AE-50",
    spec: "60 racks/h  ·  500x500 mm  ·  6.8 kW",
    price: "From NOK 64,500 excl. VAT",
    category: "Dishwashing",
    description:
      "A hood machine that removes bottlenecks in your dishwashing station. Smart water management and built-in drain pump provide consistent wash results at high loads.",
    highlights: [
      "60 racks per hour in standard program",
      "Integrated drying effect and drain pump",
      "Energy-saving mode reduces consumption by 20%",
      "Touchscreen with multilingual interface",
    ],
    specLabels: ["Capacity", "Rack size", "Power", "Water consumption", "Dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["60 racks/hour", "500 x 500 mm", "6.8 kW", "2.4 l/cycle", "635 x 750 x 1,510 mm", "104 kg", "2 years", "2 weeks"],
  },
  "pizzaovn-modular-pyralis-9": {
    name: "Pizza Oven Modular Pyralis 9",
    spec: "9 x Ø 33 cm  ·  500C  ·  17.5 kW",
    price: "From NOK 92,400 excl. VAT",
    category: "Pizza",
    description:
      "Italian craftsmanship for authentic Neapolitan pizza. Cordierite stone and separate zone control deliver precise top and bottom heat control.",
    highlights: [
      "9 pizzas Ø 33 cm simultaneously",
      "Cordierite stone for perfect bottom baking",
      "Independent top and bottom heat adjustment",
      "500 C maximum temperature",
    ],
    specLabels: ["Capacity", "Max temperature", "Power", "Voltage", "Dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["9 x Ø 33 cm", "500 C", "17.5 kW", "400V 3N~", "1,220 x 1,320 x 420 mm", "186 kg", "2 years", "3-4 weeks"],
  },
  "induksjonstopp-4-soner": {
    name: "Induction Hob 4 Zones",
    spec: "4 x 5 kW  ·  400V  ·  GN surface",
    price: "From NOK 47,800 excl. VAT",
    category: "Cook and fry",
    description:
      "Professional induction with extremely fast response and 90% efficiency. The sealed glass surface enables quick cleaning and lower kitchen temperatures.",
    highlights: [
      "4 independently controlled zones at 5 kW each",
      "Boost function for rapid heating",
      "Automatic pan detection",
      "IPX5 water protection",
    ],
    specLabels: ["Number of zones", "Power per zone", "Total power", "Voltage", "Dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["4", "5 kW", "20 kW", "400V 3N~", "800 x 730 x 250 mm", "44 kg", "2 years", "1-2 weeks"],
  },
  "frittstaende-fryseskap": {
    name: "Free-standing Freezer Cabinet",
    spec: "610 L  ·  -18 to -22 C  ·  R290",
    price: "From NOK 34,200 excl. VAT",
    category: "Cooling",
    description:
      "Large freezer cabinet with class-leading energy efficiency and robust construction for heavy-duty use. Natural refrigerant and future-proof controls.",
    highlights: [
      "610 liters volume - 7 shelves",
      "R290 natural refrigerant",
      "Self-closing door with 90 degree stop",
      "Rapid freezing and alarm on temperature deviation",
    ],
    specLabels: ["Volume", "Temperature range", "Refrigerant", "Energy class", "Dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["610 L", "-18 to -22 C", "R290", "B", "697 x 858 x 2,052 mm", "138 kg", "3 years", "1-2 weeks"],
  },
  "konvektomat-convovent-mini": {
    name: "Convection Oven ConvoVent Mini",
    spec: "6 x GN 1/1  ·  Direct steam  ·  10.4 kW",
    price: "From NOK 78,600 excl. VAT",
    category: "Combi ovens",
    description:
      "Compact German quality for cafes, bakeries, and smaller kitchens. Direct steam generator and intuitive touch control without compromise on results.",
    highlights: [
      "6 x GN 1/1 in compact footprint",
      "Direct steam generator - no warm-up delay",
      "Touchscreen with 99 preset programs",
      "Fully automatic cleaning",
    ],
    specLabels: ["Capacity", "Power", "Voltage", "Water consumption", "Dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["6 x GN 1/1", "10.4 kW", "400V 3N~", "3.2 l/cycle", "875 x 791 x 786 mm", "108 kg", "2 years", "2-3 weeks"],
  },
  "stekebord-800-mm": {
    name: "Griddle Plate 800 mm",
    spec: "Smooth + ribbed  ·  9 kW  ·  Stainless steel",
    price: "From NOK 19,400 excl. VAT",
    category: "Cook and fry",
    description:
      "Italian stainless-steel craftsmanship. Thick griddle plate for even heat distribution and long service life, designed for continuous operation.",
    highlights: [
      "Half smooth, half ribbed cooking surface",
      "Thermostat control 50-300 C",
      "Built-in grease collector",
      "AISI 304 stainless steel",
    ],
    specLabels: ["Cooking surface", "Power", "Voltage", "Temperature", "Dimensions (W×D×H)", "Weight", "Warranty", "Delivery"],
    specValues: ["800 x 540 mm", "9 kW", "400V 3N~", "50-300 C", "800 x 700 x 290 mm", "62 kg", "2 years", "1-2 weeks"],
  },
};

export function getLocalizedProduct(product: Product, locale: Locale): Product {
  if (locale === "nb") return product;
  const t = PRODUCT_EN[product.slug];
  if (!t) {
    return { ...product, category: CATEGORY_EN_BY_NB[product.category] ?? product.category };
  }
  return {
    ...product,
    name: t.name,
    spec: t.spec,
    price: t.price,
    category: t.category,
    description: t.description,
    highlights: t.highlights,
    specs: product.specs.map((spec, i) => ({
      label: t.specLabels[i] ?? spec.label,
      value: t.specValues?.[i] ?? spec.value,
    })),
  };
}

export function getLocalizedProducts(locale: Locale): Product[] {
  return PRODUCTS.map((product) => getLocalizedProduct(product, locale));
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getLocalizedProductBySlug(slug: string, locale: Locale): Product | undefined {
  const product = getProductBySlug(slug);
  return product ? getLocalizedProduct(product, locale) : undefined;
}

/** Same-category siblings for product detail «related» grids */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, limit);
}

export const FILTERS = ["Alle", "Kok og stek", "Kjøling", "Oppvask", "Pizza", "Kombidamp"];

export function getLocalizedFilters(locale: Locale): string[] {
  if (locale === "nb") return FILTERS;
  return ["All", "Cook and fry", "Cooling", "Dishwashing", "Pizza", "Combi ovens"];
}
