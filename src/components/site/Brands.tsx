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
              <h2 className="display-h2 mt-3 text-[var(--color-ink)]">
                {tr(locale, "Høy kvalitet fra europeiske produsenter.", "High quality from European manufacturers.")}
              </h2>
            </div>
            <p className="text-[13px] text-[var(--color-muted)] leading-[1.65] max-w-sm lg:text-right ">
              {tr(
                locale,
                "+ 40 andre europeiske produsenter — autorisert forhandler og servicepartner.",
                "+ 40 other European manufacturers - authorized dealer and service partner.",
              )}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
