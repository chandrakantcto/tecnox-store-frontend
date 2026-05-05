import { Compass, Truck, Wrench } from "lucide-react";
import { Reveal } from "./Reveal";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const ITEMS = [
  {
    icon: Compass,
    titleNb: "Rådgivning",
    titleEn: "Consulting",
    bodyNb: "Faglig veiledning fra første tegning til ferdig kjøkken — vi finner riktig løsning for ditt prosjekt.",
    bodyEn: "Professional guidance from first sketch to finished kitchen - we find the right solution for your project.",
  },
  {
    icon: Truck,
    titleNb: "Levering",
    titleEn: "Delivery",
    bodyNb: "Rask og trygg levering over hele Norge, med fast kontaktperson gjennom hele prosessen.",
    bodyEn: "Fast and secure delivery across Norway, with one dedicated contact throughout the process.",
  },
  {
    icon: Wrench,
    titleNb: "Service",
    titleEn: "Service",
    bodyNb: "Egne serviceteknikere, originaldeler på lager og responstid under 24 timer på akutte saker.",
    bodyEn: "In-house technicians, original spare parts in stock, and response time under 24 hours for urgent cases.",
  },
];

export function WhyUs({ locale = "nb" }: { locale?: Locale }) {
  return (
    <section className="bg-white border-y border-[var(--color-divider)] py-14 lg:py-20">
      <div className="container-x">
        <Reveal>
          <div className="mb-10 lg:mb-14 max-w-2xl">
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Hvorfor TECNOX", "Why TECNOX")}
            </span>
            <h2 className="display-h2 mt-4 text-[var(--color-ink)]">
              {tr(locale, "Mer enn en leverandør — en faglig partner.", "More than a supplier - a professional partner.")}
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-divider)] border-y border-[var(--color-divider)]">
          {ITEMS.map((it, i) => (
            <Reveal key={it.titleNb} delay={i * 0.08}>
              <div className="group relative p-7 lg:p-9 h-full overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--color-copper)] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
                <div className="flex items-start gap-5">
                  <div className="shrink-0 h-11 w-11 flex items-center justify-center bg-[var(--color-stone)] border border-[var(--color-divider)] rounded-[3px] text-[var(--color-copper)] group-hover:bg-[var(--color-copper)] group-hover:text-white transition-colors duration-300">
                    <it.icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.18em]">
                      /0{i + 1}
                    </p>
                    <h3 className="mt-2 text-[19px] lg:text-[22px] font-bold text-[var(--color-ink)] tracking-[-0.015em]">
                      {tr(locale, it.titleNb, it.titleEn)}
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.65] text-[var(--color-muted)] max-w-sm">
                      {tr(locale, it.bodyNb, it.bodyEn)}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
