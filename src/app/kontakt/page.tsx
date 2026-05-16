import type { Metadata } from "next";
import bgImg from "@/assets/ref-kantine.jpg";
import { Footer } from "@/components/site/Footer";
import { KontaktForm } from "@/components/site/KontaktForm";
import { Newsletter } from "@/components/site/Newsletter";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Kontakt oss",
  description:
    "Ta kontakt med TECNOX — kontorer i Oslo, Bergen og Trondheim. Telefon 922 22 800, post@tecnox.no.",
  openGraph: {
    title: "Kontakt TECNOX",
    description: "Tre kontorer, sertifiserte teknikere over hele Norge. Vi svarer alltid innen 24 timer.",
  },
};

const OFFICES = [
  {
    cityNb: "Moss",
    cityEn: "Moss",
    address: "Adresseveien 1, 0150 Oslo",
    phone: "922 22 800",
    email: "post@tecnox.no",
  },
  {
    cityNb: "Oslo",
    cityEn: "Oslo",
    address: "Strandgaten 14, 5013 Bergen",
    phone: "922 22 810",
    email: "post@tecnox.no",
  },
 
];

export default async function KontaktPage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <SiteHeader locale={locale} />
      <PageHero
        label={tr(locale, "Kontakt", "Contact")}
        title={<>{tr(locale, "La oss snakke om kjøkkenet ditt.", "Let's talk about your kitchen.")}</>}
        description={tr(
          locale,
          "Enten du planlegger nytt eller trenger service på eksisterende utstyr — våre fagfolk svarer alltid innen 24 timer.",
          "Whether you are planning new investments or need service on existing equipment, our specialists reply within 24 hours.",
        )}
        crumbs={[{ label: tr(locale, "Kontakt", "Contact") }]}
        bgImage={bgImg}
      />

      <section className="bg-[var(--color-stone)] section-pad">
        <div className="container-x grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20">
          <Reveal>
            <div>
              <span className="label-tag">{tr(locale, "Send forespørsel", "Send request")}</span>
              <h2 className="display-h3 mt-5 text-[var(--color-ink)]">
                {tr(locale, "Fortell oss hva du trenger.", "Tell us what you need.")}
              </h2>
              <p className="mt-4 text-[15px] text-[var(--color-muted)] leading-[1.65] max-w-md">
                {tr(
                  locale,
                  "Vi tar kontakt innen 24 timer på hverdager. Trenger du svar raskere — ring oss.",
                  "We contact you within 24 hours on business days. Need a faster answer? Call us.",
                )}
              </p>

              <KontaktForm locale={locale} />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="bg-[var(--color-dark-bg)] text-[var(--color-stone)] p-8 lg:p-10 rounded-[3px]">
              <h3 className="text-[20px] font-bold tracking-[-0.02em]">{tr(locale, "Direktekontakt", "Direct contact")}</h3>

              <div className="mt-8 space-y-6">
                <a href="tel:92222800" className="flex items-start gap-4 group">
                  <Phone className="h-5 w-5 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
                      {tr(locale, "Sentralbord", "Main line")}
                    </p>
                    <p className="mt-1 text-[20px] font-bold text-[var(--color-copper)] tracking-[-0.02em] group-hover:opacity-90">
                      922 22 800
                    </p>
                  </div>
                </a>

                <a href="mailto:post@tecnox.no" className="flex items-start gap-4 group">
                  <Mail className="h-5 w-5 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
                      {tr(locale, "E-post", "Email")}
                    </p>
                    <p className="mt-1 text-[15px] text-white group-hover:text-[var(--color-copper)] transition-colors">
                      post@tecnox.no
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)]">
                      {tr(locale, "Åpningstider", "Opening hours")}
                    </p>
                    <p className="mt-1 text-[14px] text-white">{tr(locale, "Man–fre 08:00–16:00", "Mon-Fri 08:00-16:00")}</p>
                    <p className="text-[13px] text-[var(--color-dark-muted)]">
                      {tr(locale, "Service: 24/7 for avtalekunder", "Service: 24/7 for contract customers")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-stone)] pb-24">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl mb-12">
              <span className="label-tag inline-flex items-center gap-2">
                <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
                {tr(locale, "Kontorer", "Offices")}
              </span>
              <h2 className="display-h3 mt-5 text-[var(--color-ink)]">
                {tr(locale, "Vi leverer varer over  hele landet  og  har en stor lagerbeholdning for rask levering.",
                   "We deliver goods all over the country, with a large stock that ensures fast deliveries.")}
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 max-w-5xl  gap-px bg-[var(--color-divider)] border border-[var(--color-divider)]">
            {OFFICES.map((o, i) => (
              <Reveal key={o.cityNb} delay={i * 0.1}>
                <div className="bg-white p-8 h-full pl-10">
                  <p className="text-[12px] font-mono text-[var(--color-copper)] tracking-[0.18em]">
                    /{String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-5 text-[24px] font-bold text-[var(--color-ink)] tracking-[-0.022em]">
                    {tr(locale, o.cityNb, o.cityEn)}
                  </h3>
                  <div className="mt-5 space-y-3 text-[14px] text-[var(--color-muted)]">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                      {o.address}
                    </p>
                    <p className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                      <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="hover:text-[var(--color-copper)]">
                        {o.phone}
                      </a>
                    </p>
                    <p className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-[var(--color-copper)] mt-0.5 shrink-0" strokeWidth={1.5} />
                      <a href={`mailto:${o.email}`} className="hover:text-[var(--color-copper)] break-all">
                        {o.email}
                      </a>
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
