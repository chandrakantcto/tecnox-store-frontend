import type { Metadata } from "next";
import bgImg from "@/assets/ref-restaurant.jpg";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { References } from "@/components/site/References";
import { Reveal } from "@/components/site/Reveal";
import { Service } from "@/components/site/Service";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Service og support",
  description:
    "Sertifiserte teknikere over hele Norge. Serviceavtaler, montering, reservedeler og rask responstid — vi er din faglige partner.",
  openGraph: {
    title: "Service og support — TECNOX",
    description:
      "Montering, serviceavtaler og reservedeler — sertifiserte teknikere fra Tromsø til Kristiansand.",
  },
};

const PROCESS = [
  {
    step: "01",
    titleNb: "Befaring og rådgivning",
    titleEn: "Site survey and consulting",
    descNb: "Vi besøker lokalet, kartlegger behov og tegner forslag.",
    descEn: "We visit your site, map requirements, and prepare a proposed setup.",
  },
  {
    step: "02",
    titleNb: "Prosjektering",
    titleEn: "Project planning",
    descNb: "Komplette tegninger, spesifikasjoner og prisestimat.",
    descEn: "Complete drawings, specifications, and cost estimate.",
  },
  {
    step: "03",
    titleNb: "Levering og montering",
    titleEn: "Delivery and installation",
    descNb: "Sertifiserte teknikere koordinerer hele installasjonen.",
    descEn: "Certified technicians coordinate the full installation.",
  },
  {
    step: "04",
    titleNb: "Opplæring og service",
    titleEn: "Training and service",
    descNb: "Vi sørger for at personalet kommer raskt i gang — og er der når det trengs.",
    descEn: "We ensure your team gets productive quickly and stays supported when needed.",
  },
];

export default async function ServicePage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Service og support", "Service and support")}
        title={<>{tr(locale, "Vi tar ansvar — fra første tegning til siste skrue.", "We take responsibility - from first sketch to final screw.")}</>}
        description={tr(
          locale,
          "Et profesjonelt kjøkken krever mer enn god maskinpark. Vi leverer rådgivning, montering, opplæring og serviceavtaler — under ett tak, med ett ansvar.",
          "A professional kitchen requires more than great equipment. We deliver consulting, installation, training, and service agreements under one roof with one accountable partner.",
        )}
        crumbs={[{ label: tr(locale, "Service", "Service") }]}
        bgImage={bgImg}
      />

      <section className="bg-[var(--color-stone)] section-pad">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl mb-14">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Slik jobber vi", "How we work")}
              </span>
              <h2 className="display-h2 mt-5 text-[var(--color-ink)]">
                {tr(locale, "Fire steg fra idé til ferdig kjøkken.", "Four steps from concept to finished kitchen.")}
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-divider)] border border-[var(--color-divider)]">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.08}>
                <div className="bg-[var(--color-stone)] p-8 h-full">
                  <p className="text-[12px] font-mono text-[var(--color-copper)] tracking-[0.18em]">
                    /{p.step}
                  </p>
                  <h3 className="mt-6 text-[18px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
                    {tr(locale, p.titleNb, p.titleEn)}
                  </h3>
                  <p className="mt-3 text-[14px] text-[var(--color-muted)] leading-[1.65]">
                    {tr(locale, p.descNb, p.descEn)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Service hideReadMore locale={locale} />
      <References locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
