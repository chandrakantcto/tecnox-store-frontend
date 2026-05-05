/** Three-level hierarchy for the «Produkter» desktop mega menu (column 1 → 2 → 3). */
import type { Locale } from "@/lib/locale";

export type MegaLeaf = {
  id: string;
  label: string;
};

export type MegaSub = {
  id: string;
  label: string;
  /** Third column — optional finer categories */
  children?: MegaLeaf[];
};

export type MegaMain = {
  id: string;
  label: string;
  count: number;
  subs: MegaSub[];
};

export const MEGA_MENU_TREE: MegaMain[] = [
  {
    id: "kok-stek",
    label: "Kok og stek",
    count: 186,
    subs: [
      {
        id: "kok-induksjon",
        label: "Induksjon og stekefelt",
        children: [
          { id: "kok-ind-4", label: "4 soner / 70-serie" },
          { id: "kok-ind-6", label: "6 soner / 90-serie" },
          { id: "kok-ind-rund", label: "Runde koketopper" },
          { id: "kok-ind-bygg", label: "Bygg-inn utstyr" },
        ],
      },
      {
        id: "kok-konvek",
        label: "Konvektomat og combi",
        children: [
          { id: "kok-konv-6", label: "6 x GN 1/1" },
          { id: "kok-konv-10", label: "10 x GN 1/1" },
          { id: "kok-konv-tilbehor", label: "Tilbehør og stativ" },
        ],
      },
      {
        id: "kok-steke",
        label: "Stekeovn og grill",
        children: [
          { id: "kok-st-salamander", label: "Salamander" },
          { id: "kok-st-grill", label: "Kontaktgrill" },
          { id: "kok-st-steke", label: "Elektrisk stekeovn" },
        ],
      },
      {
        id: "kok-koge",
        label: "Kokekasseroller og pastakoker",
        children: [{ id: "kok-kog-pasta", label: "Pastakoker" }, { id: "kok-kog-kjele", label: "Induksjonskjeler" }],
      },
      { id: "kok-frityr", label: "Frityrgryter og filter", children: [{ id: "kok-fri-kg", label: "Under benk" }, { id: "kok-fri-set", label: "Settblokk" }] },
    ],
  },
  {
    id: "kjoling",
    label: "Kjøle- og frysutstyr",
    count: 242,
    subs: [
      {
        id: "kjol-skap",
        label: "Kjøleskap og kjølerom",
        children: [
          { id: "kjol-sk-u", label: "Underbenk kjøl" },
          { id: "kjol-sk-glass", label: "Glassdør mediar" },
          { id: "kjol-sk-preparat", label: "Preparatskap" },
        ],
      },
      {
        id: "kjol-frys",
        label: "Frys og kjølebenk",
        children: [
          { id: "kjol-fr-skuffer", label: "Med skuffer" },
          { id: "kjol-fr-lade", label: "Med låger" },
        ],
      },
      {
        id: "kjol-kjolerom",
        label: "Moduler og kjølerom",
        children: [{ id: "kjol-kr-mod", label: "Modulkjøl" }, { id: "kjol-kr-vik", label: "Vikdør og kjølerom" }],
      },
      { id: "kjol-karb", label: "Karbot og terrasser", children: [{ id: "kjol-ka-sushi", label: "Sushi / saladette" }] },
    ],
  },
  {
    id: "oppvask",
    label: "Oppvaskmaskiner",
    count: 94,
    subs: [
      {
        id: "opp-front",
        label: "Frontlasting",
        children: [{ id: "opp-fr-500", label: "500 mm kurv" }, { id: "opp-fr-600", label: "600 mm kurv" }],
      },
      {
        id: "opp-kupp",
        label: "Kupp og hette",
        children: [{ id: "opp-ku-konv", label: "Med konvektør" }, { id: "opp-ku-spyl", label: "Spylaggregat" }],
      },
      { id: "opp-glass", label: "Glass og bestikk", children: [{ id: "opp-gl-sm", label: "Smal kurv" }] },
      { id: "opp-tilbehor", label: "Kurve og kjemikalier", children: [{ id: "opp-ti-k", label: "Kurve og insert" }] },
    ],
  },
  {
    id: "kombi",
    label: "Kombidampere",
    count: 58,
    subs: [
      {
        id: "kom-rational",
        label: "Rational iCombi",
        children: [{ id: "kom-r-xs", label: "XS / compact" }, { id: "kom-r-pro", label: "Pro 10 og 20" }],
      },
      {
        id: "kom-unox",
        label: "Unox og øvrige",
        children: [{ id: "kom-u-cheftop", label: "Cheftop Mind Maps" }, { id: "kom-u-baker", label: "Baker-top" }],
      },
      { id: "kom-stativ", label: "Stativ og vogn", children: [{ id: "kom-st-gn", label: "GN 1/1" }] },
    ],
  },
  {
    id: "maskiner",
    label: "Kjøkkenmaskiner",
    count: 312,
    subs: [
      {
        id: "km-deig",
        label: "Deig og kjøttkvern",
        children: [{ id: "km-de-spiral", label: "Spiralmixer" }, { id: "km-de-plan", label: "Planetarer" }],
      },
      {
        id: "km-kutter",
        label: "Kutter og blender",
        children: [{ id: "km-ku-stav", label: "Stavmiksere" }, { id: "km-ku-jog", label: "Kutter og joggesykler" }],
      },
      { id: "km-slicer", label: "Skiver", children: [{ id: "km-sl-auto", label: "Automatisk skiver" }] },
      { id: "km-vaku", label: "Vakuum og sous vide", children: [{ id: "km-va-kammer", label: "Kammer" }] },
    ],
  },
  {
    id: "pizza",
    label: "Pizzautstyr",
    count: 76,
    subs: [
      {
        id: "pz-ovn",
        label: "Pizzaovner",
        children: [{ id: "pz-ov-elek", label: "Elektrisk stein" }, { id: "pz-ov-gass", label: "Gass / kombi" }],
      },
      {
        id: "pz-bord",
        label: "Bord og kjølerenne",
        children: [{ id: "pz-bo-gran", label: "Granitt benk" }],
      },
      { id: "pz-deig", label: "Deigutstyr", children: [{ id: "pz-de-kjev", label: "Kjevlemaskiner" }] },
    ],
  },
  {
    id: "kjolerom",
    label: "Kjølerom og fryserom",
    count: 44,
    subs: [
      {
        id: "kr-panel",
        label: "Panel og aggregat",
        children: [{ id: "kr-pa-monoblock", label: "Monoblokk" }, { id: "kr-pa-split", label: "Split anlegg" }],
      },
      { id: "kr-dorer", label: "Dører og tilbehør", children: [{ id: "kr-do-slakt", label: "Slakteridør" }] },
    ],
  },
  {
    id: "kaffe",
    label: "Kaffemaskin og bar",
    count: 138,
    subs: [
      {
        id: "kf-espresso",
        label: "Espresso og kvern",
        children: [{ id: "kf-es-2gr", label: "2-gruppers" }, { id: "kf-es-auto", label: "Automat" }],
      },
      {
        id: "kf-koke",
        label: "Vann og kokende",
        children: [{ id: "kf-ko-kje", label: "Vannkjeler" }],
      },
      { id: "kf-blender", label: "Bar og blender", children: [{ id: "kf-bl-pro", label: "Profil blender" }] },
    ],
  },
  {
    id: "servering",
    label: "Serveringsutstyr",
    count: 421,
    subs: [
      {
        id: "sv-buffet",
        label: "Buffet og utstilling",
        children: [{ id: "sv-bu-varme", label: "Varme batterier" }, { id: "sv-bu-kjol", label: "Kjølebuffet" }],
      },
      {
        id: "sv-bestikk",
        label: "Bestikk og tallerken",
        children: [{ id: "sv-be-profi", label: "Profiserie" }],
      },
      { id: "sv-trans", label: "Transport og kasser", children: [{ id: "sv-tr-term", label: "Termobokser" }] },
    ],
  },
  {
    id: "rengjoring",
    label: "Rengjøring og hygiene",
    count: 167,
    subs: [
      {
        id: "rg-gulv",
        label: "Gulv og avløp",
        children: [{ id: "rg-gu-skrape", label: "Skraper og moppar" }],
      },
      {
        id: "rg-personlig",
        label: "Personlig hygiene",
        children: [{ id: "rg-pe-station", label: "Dispensere" }],
      },
      { id: "rg-kjem", label: "Kjemikalier og dosering", children: [{ id: "rg-kj-auto", label: "Automat dose" }] },
    ],
  },
];

const EN_LABEL_BY_ID: Record<string, string> = {
  "kok-stek": "Cook and fry",
  "kok-induksjon": "Induction and frytops",
  "kok-ind-4": "4 zones / 70 series",
  "kok-ind-6": "6 zones / 90 series",
  "kok-ind-rund": "Round hobs",
  "kok-ind-bygg": "Built-in equipment",
  "kok-konvek": "Convection and combi",
  "kok-konv-6": "6 x GN 1/1",
  "kok-konv-10": "10 x GN 1/1",
  "kok-konv-tilbehor": "Accessories and stands",
  "kok-steke": "Ovens and grills",
  "kok-st-salamander": "Salamander",
  "kok-st-grill": "Contact grill",
  "kok-st-steke": "Electric oven",
  "kok-koge": "Boiling kettles and pasta cookers",
  "kok-kog-pasta": "Pasta cooker",
  "kok-kog-kjele": "Induction kettles",
  "kok-frityr": "Fryers and filters",
  "kok-fri-kg": "Undercounter",
  "kok-fri-set": "Suite block",
  "kjoling": "Cooling and freezing",
  "kjol-skap": "Refrigerators and cold rooms",
  "kjol-sk-u": "Undercounter fridge",
  "kjol-sk-glass": "Glass door display",
  "kjol-sk-preparat": "Prep refrigerators",
  "kjol-frys": "Freezers and refrigerated counters",
  "kjol-fr-skuffer": "With drawers",
  "kjol-fr-lade": "With doors",
  "kjol-kjolerom": "Modules and cold rooms",
  "kjol-kr-mod": "Modular cold room",
  "kjol-kr-vik": "Hinged door and cold room",
  "kjol-karb": "Cabinets and counters",
  "kjol-ka-sushi": "Sushi / saladette",
  "oppvask": "Dishwashers",
  "opp-front": "Front-loading",
  "opp-fr-500": "500 mm rack",
  "opp-fr-600": "600 mm rack",
  "opp-kupp": "Hood-type",
  "opp-ku-konv": "With condenser",
  "opp-ku-spyl": "Pre-rinse unit",
  "opp-glass": "Glass and cutlery",
  "opp-gl-sm": "Narrow rack",
  "opp-tilbehor": "Racks and chemicals",
  "opp-ti-k": "Racks and inserts",
  kombi: "Combi ovens",
  "kom-rational": "Rational iCombi",
  "kom-r-xs": "XS / compact",
  "kom-r-pro": "Pro 10 and 20",
  "kom-unox": "Unox and others",
  "kom-u-cheftop": "Cheftop Mind Maps",
  "kom-u-baker": "Baker-top",
  "kom-stativ": "Stands and trolleys",
  "kom-st-gn": "GN 1/1",
  maskiner: "Kitchen machinery",
  "km-deig": "Dough and meat grinders",
  "km-de-spiral": "Spiral mixers",
  "km-de-plan": "Planetary mixers",
  "km-kutter": "Cutters and blenders",
  "km-ku-stav": "Hand blenders",
  "km-ku-jog": "Cutters and processors",
  "km-slicer": "Slicers",
  "km-sl-auto": "Automatic slicers",
  "km-vaku": "Vacuum and sous vide",
  "km-va-kammer": "Chamber models",
  pizza: "Pizza equipment",
  "pz-ovn": "Pizza ovens",
  "pz-ov-elek": "Electric stone deck",
  "pz-ov-gass": "Gas / hybrid",
  "pz-bord": "Prep counters and topping rails",
  "pz-bo-gran": "Granite counter",
  "pz-deig": "Dough equipment",
  "pz-de-kjev": "Dough sheeters",
  kjolerom: "Cold rooms and freezer rooms",
  "kr-panel": "Panels and refrigeration units",
  "kr-pa-monoblock": "Monoblock",
  "kr-pa-split": "Split system",
  "kr-dorer": "Doors and accessories",
  "kr-do-slakt": "Butcher door",
  kaffe: "Coffee and bar",
  "kf-espresso": "Espresso and grinders",
  "kf-es-2gr": "2-group",
  "kf-es-auto": "Automatic",
  "kf-koke": "Boiling water systems",
  "kf-ko-kje": "Water boilers",
  "kf-blender": "Bar and blenders",
  "kf-bl-pro": "Professional blender",
  servering: "Serving equipment",
  "sv-buffet": "Buffet and display",
  "sv-bu-varme": "Heated stations",
  "sv-bu-kjol": "Refrigerated buffet",
  "sv-bestikk": "Cutlery and tableware",
  "sv-be-profi": "Professional series",
  "sv-trans": "Transport and boxes",
  "sv-tr-term": "Insulated boxes",
  rengjoring: "Cleaning and hygiene",
  "rg-gulv": "Floors and drainage",
  "rg-gu-skrape": "Scrapers and mops",
  "rg-personlig": "Personal hygiene",
  "rg-pe-station": "Dispensers",
  "rg-kjem": "Chemicals and dosing",
  "rg-kj-auto": "Automatic dosing",
};

export function getMegaMenuTree(locale: Locale): MegaMain[] {
  if (locale === "nb") return MEGA_MENU_TREE;
  return MEGA_MENU_TREE.map((main) => ({
    ...main,
    label: EN_LABEL_BY_ID[main.id] ?? main.label,
    subs: main.subs.map((sub) => ({
      ...sub,
      label: EN_LABEL_BY_ID[sub.id] ?? sub.label,
      children: sub.children?.map((leaf) => ({
        ...leaf,
        label: EN_LABEL_BY_ID[leaf.id] ?? leaf.label,
      })),
    })),
  }));
}
