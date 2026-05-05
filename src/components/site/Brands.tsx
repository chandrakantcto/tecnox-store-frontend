import type { ReactNode } from "react";
import Image from "next/image";
import { Reveal } from "./Reveal";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

type Brand = {
  name: string;
  /** Stylized text mark — typography & weight chosen to evoke each brand */
  render: () => ReactNode;
};

const BRANDS: Brand[] = [
  {
    name: "Rational",
    render: () => (
      <span className="font-black text-[18px] tracking-[-0.04em] lowercase">
        rational<span className="text-[var(--color-copper)]">.</span>
      </span>
    ),
  },
  {
    name: "Electrolux Professional",
    render: () => (
      <span className="text-[12px] tracking-[0.02em] flex flex-col items-center leading-[1.05]">
        <span className="font-light italic">Electrolux</span>
        <span className="font-medium tracking-[0.22em] text-[9px] uppercase mt-0.5">Professional</span>
      </span>
    ),
  },
  {
    name: "Convotherm",
    render: () => (
      <span className="font-bold text-[15px] tracking-[0.02em] uppercase">
        Convo<span className="font-light">therm</span>
      </span>
    ),
  },
  {
    name: "Gram Commercial",
    render: () => (
      <span className="font-extrabold text-[18px] tracking-[-0.02em] uppercase">
        GRAM
      </span>
    ),
  },
  {
    name: "Hendi",
    render: () => (
      <Image
        src="/brands/hendi.svg"
        alt="Hendi"
        width={140}
        height={34}
        className="h-[26px] w-auto max-w-[min(100%,140px)] object-contain opacity-80 transition-opacity duration-300 group-hover:opacity-100"
      />
    ),
  },
  {
    name: "Aristarco",
    render: () => (
      <span className="font-semibold text-[15px] tracking-[0.18em] uppercase italic">
        Aristarco
      </span>
    ),
  },
  {
    name: "Modular",
    render: () => (
      <span className="font-black text-[16px] tracking-[0.04em] uppercase">
        MODULAR
      </span>
    ),
  },
  {
    name: "Sirman",
    render: () => (
      <span className="font-bold text-[17px] tracking-[0.16em] uppercase">
        SIRMAN
      </span>
    ),
  },
  {
    name: "Tecnodom",
    render: () => (
      <span className="text-[15px] tracking-[0.05em] uppercase font-medium">
        Tecno<span className="font-bold">dom</span>
      </span>
    ),
  },
];

export function Brands({ locale = "nb" }: { locale?: Locale }) {
  return (
    <section className="bg-white py-14 lg:py-16 border-b border-[var(--color-divider)]">
      <div className="container-x">
        <Reveal>
          <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="max-w-xl">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Vi fører ledende merker", "We stock leading brands")}
              </span>
              <h2 className="display-h3 mt-3 text-[var(--color-ink)]">
                {tr(locale, "Bare utstyr vi selv ville valgt.", "Only equipment we would choose ourselves.")}
              </h2>
            </div>
            <p className="text-[13px] text-[var(--color-muted)] leading-[1.65] max-w-sm lg:text-right">
              {tr(
                locale,
                "+ 40 andre europeiske produsenter — autorisert forhandler og servicepartner.",
                "+ 40 other European manufacturers - authorized dealer and service partner.",
              )}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 border-t border-l border-[var(--color-divider)] rounded-[3px] overflow-hidden">
            {BRANDS.map((b) => (
              <div
                key={b.name}
                title={b.name}
                className="group relative h-20 lg:h-24 flex items-center justify-center px-3 border-r border-b border-[var(--color-divider)] bg-white hover:bg-[var(--color-stone)] transition-colors duration-300 cursor-pointer"
              >
                <div className="text-[oklch(0.5_0.005_60)] group-hover:text-[var(--color-ink)] transition-colors duration-300">
                  {b.render()}
                </div>
                <span className="absolute top-0 left-0 h-px w-0 bg-[var(--color-copper)] group-hover:w-full transition-all duration-500 ease-out" />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
