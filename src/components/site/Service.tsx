import { Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const ITEMS = [
  {
    num: "01",
    titleNb: "Montering og installasjon",
    titleEn: "Installation and commissioning",
    subNb: "Sertifiserte teknikere over hele landet",
    subEn: "Certified technicians across the country",
  },
  {
    num: "02",
    titleNb: "Serviceavtaler",
    titleEn: "Service agreements",
    subNb: "Forutsigbar drift og prioritert support",
    subEn: "Predictable operations and prioritized support",
  },
  {
    num: "03",
    titleNb: "Reservedeler og reparasjon",
    titleEn: "Spare parts and repair",
    subNb: "Rask tilgang til originaldeler",
    subEn: "Fast access to original spare parts",
  },
];

type ServiceProps = {
  /** Hide «Les mer om service» on /service */
  hideReadMore?: boolean;
  locale?: Locale;
};

export function Service({ hideReadMore = false, locale = "nb" }: ServiceProps) {
  return (
    <section className="grid lg:grid-cols-[1.1fr_1fr] bg-white border-y border-[var(--color-divider)]">
      {/* Left */}
      <div className="bg-white py-16 lg:py-20 px-6 lg:px-14 xl:px-20">
        <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto lg:mr-10">
          <Reveal>
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Service", "Service")}
            </span>
            <h2 className="mt-4 text-[30px] lg:text-[40px] font-bold leading-[1.05] tracking-[-0.028em] text-[var(--color-ink)]">
              {tr(locale, "Vi er med deg hele veien.", "We are with you all the way.")}
            </h2>
            <p className="mt-4 max-w-[440px] text-[15px] leading-[1.65] text-[var(--color-muted)]">
              {tr(
                locale,
                "Fra rådgivning og prosjektering til installasjon, opplæring og serviceavtaler. Du slipper å koordinere mange leverandører — vi tar ansvar for hele leveransen.",
                "From consulting and planning to installation, training, and service agreements. You avoid coordinating many suppliers - we take ownership of the whole delivery.",
              )}
            </p>
          </Reveal>

          <div className="mt-10 space-y-1">
            {ITEMS.map((it, i) => (
              <Reveal key={it.titleNb} delay={0.1 + i * 0.08}>
                <div className="group flex items-start gap-4 py-4 border-t border-[var(--color-divider)] last:border-b">
                  <span className="text-[10px] font-mono text-[var(--color-copper)] tracking-[0.1em] mt-1 w-8 shrink-0">
                    /{it.num}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-[var(--color-ink)] tracking-[-0.01em]">
                      {tr(locale, it.titleNb, it.titleEn)}
                    </h3>
                    <p className="mt-1 text-[13px] text-[var(--color-muted)] leading-relaxed">
                      {tr(locale, it.subNb, it.subEn)}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-[var(--color-muted)] mt-1.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                    strokeWidth={1.75}
                  />
                </div>
              </Reveal>
            ))}
          </div>

          {!hideReadMore && (
            <Reveal delay={0.4}>
              <Link
                href="/service"
                className="mt-8 inline-flex items-center gap-1.5 text-[var(--color-copper)] text-[14px] font-medium hover:gap-2.5 transition-all"
              >
                {tr(locale, "Les mer om service", "Read more about service")}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </Reveal>
          )}
        </div>
      </div>

      {/* Right — sticky contact card on stone */}
      <div className="bg-[var(--color-stone)] py-16 lg:py-20 px-6 lg:px-14 xl:px-16 border-t lg:border-t-0 lg:border-l border-[var(--color-divider)]">
        <Reveal delay={0.15}>
          <div className="max-w-md">
            <span className="label-tag inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Kontakt service", "Contact service")}
            </span>
            <h3 className="text-[24px] lg:text-[30px] font-bold leading-tight text-[var(--color-ink)] tracking-[-0.022em]">
              {tr(locale, "Bestill servicebesøk —", "Book a service visit -")}
              <br />
              <span className="text-[var(--color-muted)] italic font-normal">
                {tr(locale, "vi kommer til deg.", "we come to you.")}
              </span>
            </h3>

            <div className="mt-8 grid gap-3">
              <a
                href="tel:92222800"
                className="group flex items-center gap-4 bg-white border border-[var(--color-divider)] hover:border-[var(--color-copper)] p-4 rounded-[3px] transition-colors"
              >
                <span className="h-10 w-10 flex items-center justify-center bg-[var(--color-stone)] border border-[var(--color-divider)] rounded-[2px] shrink-0 group-hover:bg-[var(--color-copper)] group-hover:border-[var(--color-copper)] transition-colors">
                  <Phone className="h-4 w-4 text-[var(--color-copper)] group-hover:text-white" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {tr(locale, "Telefon", "Phone")}
                  </p>
                  <p className="text-[18px] font-bold text-[var(--color-ink)] tracking-[-0.015em]">922 22 800</p>
                </div>
              </a>

              <a
                href="mailto:post@tecnox.no"
                className="group flex items-center gap-4 bg-white border border-[var(--color-divider)] hover:border-[var(--color-copper)] p-4 rounded-[3px] transition-colors"
              >
                <span className="h-10 w-10 flex items-center justify-center bg-[var(--color-stone)] border border-[var(--color-divider)] rounded-[2px] shrink-0 group-hover:bg-[var(--color-copper)] group-hover:border-[var(--color-copper)] transition-colors">
                  <Mail className="h-4 w-4 text-[var(--color-copper)] group-hover:text-white" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {tr(locale, "E-post", "Email")}
                  </p>
                  <p className="text-[14px] font-semibold text-[var(--color-ink)] truncate">post@tecnox.no</p>
                </div>
              </a>
            </div>

            <Link href="/kontakt" className="btn-primary mt-6 w-full sm:w-auto">
              {tr(locale, "Send forespørsel", "Send request")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
