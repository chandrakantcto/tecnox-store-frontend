"use client";

import { Reveal } from "./Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const FAQS = [
  {
    qNb: "Hvor lang er leveringstiden?",
    qEn: "How long is the delivery time?",
    aNb: "Standard lagerførte produkter sendes innen 1–3 virkedager. Spesialbestillinger og større oppsett avtales individuelt — vi gir alltid en bindende leveringsdato før ordre bekreftes.",
    aEn: "Standard in-stock products ship within 1-3 business days. Special orders and larger setups are planned individually, and we always provide a binding delivery date before order confirmation.",
  },
  {
    qNb: "Hvilken garanti har dere på utstyret?",
    qEn: "What warranty do you offer?",
    aNb: "Alle våre produkter leveres med minimum 2 års garanti. Flere merker som Rational og Electrolux Professional har utvidet garanti opptil 5 år ved registrert servicehistorikk.",
    aEn: "All our products include at least a 2-year warranty. Several brands, including Rational and Electrolux Professional, offer extended warranty up to 5 years with documented service history.",
  },
  {
    qNb: "Tilbyr dere montering og installasjon?",
    qEn: "Do you provide installation and commissioning?",
    aNb: "Ja. Vi har egne sertifiserte teknikere som utfører levering, montering, igangkjøring og opplæring i hele Norge. Tilbudet inkluderer også tilpasninger til vann, strøm og avtrekk.",
    aEn: "Yes. Our certified technicians handle delivery, installation, commissioning, and training across Norway. The service also includes adaptations for water, power, and ventilation.",
  },
  {
    qNb: "Kan jeg finansiere kjøpet over leasing?",
    qEn: "Can I finance the purchase through leasing?",
    aNb: "Vi tilbyr leasing og avbetaling gjennom DNB Finans og SG Finans. Typisk fra 36 til 60 måneder, med fast eller flytende rente. Be om et finansieringseksempel sammen med tilbudet.",
    aEn: "We offer leasing and installment financing through DNB Finans and SG Finans, typically 36 to 60 months with fixed or variable rates. Ask for a financing example together with your quote.",
  },
  {
    qNb: "Hvordan håndterer dere service og reservedeler?",
    qEn: "How do you handle service and spare parts?",
    aNb: "Vi har egne serviceteknikere og originaldeler på lager for de mest brukte modellene. Responstid under 24 timer ved akutt nedetid — gjelder hele Norge.",
    aEn: "We have in-house service technicians and original spare parts in stock for the most common models. Response time is under 24 hours for urgent downtime cases across Norway.",
  },
  {
    qNb: "Kan jeg få et tilbud uten å registrere meg?",
    qEn: "Can I request a quote without registering?",
    aNb: "Ja. Bruk «Be om tilbud» på produktsiden eller kontakt oss direkte. Du får et skreddersydd tilbud på e-post, normalt innen samme arbeidsdag.",
    aEn: 'Yes. Use "Request a quote" on the product page or contact us directly. You receive a tailored quote by email, normally within the same business day.',
  },
];

export function Faq({ locale = "nb" }: { locale?: Locale }) {
  return (
    <section className="bg-[var(--color-stone)] section-pad border-y border-[var(--color-divider)]">
      <div className="container-x grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20">
        <Reveal>
          <div className="lg:sticky lg:top-32">
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Vanlige spørsmål", "Frequently asked questions")}
            </span>
            <h2 className="display-h2 mt-4 text-[var(--color-ink)]">
              {tr(locale, "Svar på det ", "Answers to what ")}
              <span className="italic font-normal text-[var(--color-copper)]">
                {tr(locale, "fagfolk", "professionals")}
              </span>
              {tr(locale, " spør om.", " ask about.")}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-[var(--color-muted)] max-w-md">
              {tr(locale, "Finner du ikke svaret? Ring oss på ", "Can't find the answer? Call us at ")}
              <a href="tel:92222800" className="text-[var(--color-copper)] font-semibold">
                922 22 800
              </a>{" "}
              {tr(locale, "eller send en e-post — vi svarer normalt samme dag.", "or send an email - we usually reply the same day.")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Accordion type="single" collapsible className="border-t border-[var(--color-divider)]">
              {FAQS.map((f, i) => (
              <AccordionItem
                  key={f.qNb}
                value={`item-${i}`}
                className="border-b border-[var(--color-divider)]"
              >
                <AccordionTrigger className="py-5 text-left text-[15px] lg:text-[17px] font-semibold text-[var(--color-ink)] hover:text-[var(--color-copper)] hover:no-underline tracking-[-0.01em]">
                  <span className="flex items-baseline gap-4">
                    <span className="text-[11px] font-mono text-[var(--color-copper)] tracking-[0.18em] shrink-0">
                      /{String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{tr(locale, f.qNb, f.qEn)}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-12 text-[14px] leading-[1.7] text-[var(--color-muted)]">
                  {tr(locale, f.aNb, f.aEn)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
