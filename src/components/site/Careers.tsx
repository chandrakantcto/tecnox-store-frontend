"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Reveal } from "./Reveal";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { useActiveLocale } from "@/hooks/use-active-locale";

const PERKS = [
  {
    titleNb: "Fagmiljø",
    titleEn: "Professional environment",
    descNb: "Arbeid med europeisk toppmerkeutstyr og krevende storkjøkkenprosjekter over hele Norge.",
    descEn: "Work with top European brands and demanding commercial kitchen projects across Norway.",
  },
  {
    titleNb: "Lokal tilstedeværelse",
    titleEn: "Local presence",
    descNb: "Kontorer og teknikere fra kyst til kyst — du er nær kundene, ikke på et fjernt hovedkontor.",
    descEn: "Offices and technicians coast to coast — you stay close to customers, not a distant HQ.",
  },
  {
    titleNb: "Utvikling",
    titleEn: "Development",
    descNb: "Sertifisering, produktopplæring og lang erfaring i bransjen — vi investerer i folkene våre.",
    descEn: "Certification, product training, and deep industry experience — we invest in our people.",
  },
];

const OPENINGS = [
  {
    roleNb: "Servicetekniker",
    roleEn: "Service technician",
    locationNb: "Oslo / Bergen / Trondheim",
    locationEn: "Oslo / Bergen / Trondheim",
    typeNb: "Heltid",
    typeEn: "Full-time",
  },
  {
    roleNb: "Selger storkjøkken",
    roleEn: "Commercial kitchen sales",
    locationNb: "Hele Norge",
    locationEn: "Nationwide",
    typeNb: "Heltid",
    typeEn: "Full-time",
  },
  {
    roleNb: "Åpen søknad",
    roleEn: "Open application",
    locationNb: "Alle avdelinger",
    locationEn: "All departments",
    typeNb: "Løpende",
    typeEn: "Ongoing",
  },
];

export function Careers({ locale: _locale }: { locale?: Locale }) {
  const locale = useActiveLocale();
  return (
    <section className="bg-[var(--color-stone)] section-pad">
      <div className="container-x">
        <Reveal>
          <div className="max-w-3xl mb-14">
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Karriere", "Careers")}
            </span>
            <h2 className="display-h2 mt-5 text-[var(--color-ink)]">
              {tr(locale, "Bli en del av TECNOX.", "Become part of TECNOX.")}
            </h2>
            <p className="mt-5 text-[16px] text-[var(--color-muted)] leading-[1.6] max-w-[560px]">
              {tr(
                locale,
                "Vi søker engasjerte fagfolk som vil levere kvalitet til norske storkjøkken — fra salg og rådgivning til montering og service.",
                "We look for dedicated professionals who deliver quality to Norwegian commercial kitchens — from sales and consulting to installation and service.",
              )}
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {PERKS.map((p, i) => (
            <Reveal key={p.titleNb} delay={i * 0.1}>
              <div className="bg-white p-8 h-full border-t-2 border-[var(--color-copper)] rounded-[3px]">
                <p className="text-[12px] font-mono text-[var(--color-copper)] tracking-[0.18em]">
                  /{String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-5 text-[20px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
                  {tr(locale, p.titleNb, p.titleEn)}
                </h3>
                <p className="mt-3 text-[14px] text-[var(--color-muted)] leading-[1.65]">
                  {tr(locale, p.descNb, p.descEn)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="max-w-3xl mb-10">
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Ledige stillinger", "Open positions")}
            </span>
          </div>
        </Reveal>

        <div className="grid gap-px bg-[var(--color-divider)] border border-[var(--color-divider)] max-w-4xl">
          {OPENINGS.map((o, i) => (
            <Reveal key={o.roleNb} delay={i * 0.08}>
              <div className="bg-white px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-[18px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
                    {tr(locale, o.roleNb, o.roleEn)}
                  </h3>
                  <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                    {tr(locale, o.locationNb, o.locationEn)} · {tr(locale, o.typeNb, o.typeEn)}
                  </p>
                </div>
                <a
                  href="mailto:post@tecnox.no?subject=Søknad"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-copper)] hover:opacity-90 shrink-0"
                >
                  {tr(locale, "Send søknad", "Apply")}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-14 max-w-xl bg-[var(--color-dark-bg)] text-[var(--color-stone)] p-8 lg:p-10 rounded-[3px]">
            <h3 className="text-[20px] font-bold tracking-[-0.02em]">
              {tr(locale, "Spørsmål om stillinger?", "Questions about roles?")}
            </h3>
            <p className="mt-3 text-[14px] text-[var(--color-dark-muted)] leading-[1.65]">
              {tr(
                locale,
                "Send oss en e-post eller bruk kontaktskjemaet — vi svarer innen 24 timer på hverdager.",
                "Email us or use the contact form — we reply within 24 hours on business days.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href="mailto:post@tecnox.no" className="btn-primary inline-flex items-center gap-2">
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                post@tecnox.no
              </a>
              <Link href="/kontakt" className="btn-outline-dark inline-flex items-center gap-2">
                {tr(locale, "Kontaktskjema", "Contact form")}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
