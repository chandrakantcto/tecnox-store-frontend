"use client";

import { Reveal } from "@/components/site/Reveal";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

export type LegalSection = {
  headingNb: string;
  headingEn: string;
  paragraphsNb: string[];
  paragraphsEn: string[];
  listNb?: string[];
  listEn?: string[];
};

export function LegalContent({
  locale: _locale,
  sections,
  lastUpdatedNb,
  lastUpdatedEn,
}: {
  locale: Locale;
  sections: LegalSection[];
  lastUpdatedNb: string;
  lastUpdatedEn: string;
}) {
  const locale = useActiveLocale();

  return (
    <section className="bg-[var(--color-stone)] section-pad pb-24">
      <div className="container-x">
        <Reveal>
          <p className="max-w-3xl text-[13px] text-[var(--color-muted)] mb-10">
            {tr(locale, lastUpdatedNb, lastUpdatedEn)}
          </p>
        </Reveal>

        <div className="max-w-full">
          {sections.map((section, index) => (
            <Reveal key={section.headingNb} delay={index * 0.04}>
              <article className={index > 0 ? "mt-10 pt-10 border-t border-[var(--color-divider)]" : ""}>
                <h2 className="text-[20px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
                  {tr(locale, section.headingNb, section.headingEn)}
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-[1.7] text-[var(--color-muted)]">
                  {tr(locale, section.paragraphsNb, section.paragraphsEn).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {(section.listNb || section.listEn) && (
                  <ul className="mt-4 space-y-2 text-[15px] leading-[1.7] text-[var(--color-muted)] list-disc pl-5">
                    {tr(locale, section.listNb ?? [], section.listEn ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
