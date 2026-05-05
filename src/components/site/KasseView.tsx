"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/site/TopBar";
import { MainNav } from "@/components/site/MainNav";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { useCart, formatNOK } from "@/contexts/CartContext";
import { Check, ShieldCheck, Truck, Phone } from "lucide-react";
import heroImg from "@/assets/hero-combi.jpg";

export function KasseView() {
  const router = useRouter();
  const { detailedItems, subtotal, itemCount, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reference] = useState(() => `TECNOX-${Date.now().toString().slice(-6)}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setConfirmed(true);
      clear();
    }, 600);
  };

  if (confirmed) {
    return (
      <main className="min-h-screen bg-[var(--color-stone)]">
        <header className="sticky top-0 z-50">
          <TopBar />
          <MainNav />
        </header>
        <PageHero
          label="Bekreftet"
          title={<>Takk! Forespørselen er sendt.</>}
          crumbs={[
            { label: "Handlekurv", to: "/handlekurv" },
            { label: "Bekreftelse" },
          ]}
          bgImage={heroImg}
        />
        <section className="container-x py-16 lg:py-24">
          <Reveal>
            <div className="max-w-xl mx-auto text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-copper)] text-white">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h2 className="mt-6 display-h3 text-[var(--color-ink)]">
                Vi tar kontakt innen 24 timer.
              </h2>
              <p className="mt-4 text-[15px] text-[var(--color-muted)] leading-[1.65]">
                En av våre fagfolk gjennomgår forespørselen og sender deg et komplett tilbud — med priser, leveringstid, montering og opplæring.
              </p>
              <p className="mt-6 text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Referanse
              </p>
              <p className="mt-1 font-mono text-[18px] font-bold text-[var(--color-ink)]">
                {reference}
              </p>
              <div className="mt-10 flex flex-wrap gap-3 justify-center">
                <Link href="/" className="btn-primary">Tilbake til forsiden</Link>
                <Link href="/produkter" className="btn-outline-dark">Fortsett å bla</Link>
              </div>
            </div>
          </Reveal>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav />
      </header>

      <PageHero
        label="Tilbudsforespørsel"
        title={<>Fullfør forespørselen.</>}
        description="Fyll inn kontaktinformasjon — vi sender et skreddersydd tilbud innen 24 timer på hverdager."
        crumbs={[
          { label: "Handlekurv", to: "/handlekurv" },
          { label: "Tilbudsforespørsel" },
        ]}
        bgImage={heroImg}
      />

      <section className="bg-[var(--color-stone)] section-pad pt-12 lg:pt-16">
        <div className="container-x">
          {detailedItems.length === 0 ? (
            <Reveal>
              <div className="max-w-xl mx-auto text-center py-16">
                <h2 className="display-h3 text-[var(--color-ink)]">
                  Handlekurven er tom.
                </h2>
                <p className="mt-4 text-[15px] text-[var(--color-muted)]">
                  Legg til produkter før du sender forespørsel.
                </p>
                <div className="mt-8 flex gap-3 justify-center">
                  <Link href="/produkter" className="btn-primary">Se produkter</Link>
                  <button
                    type="button"
                    onClick={() => router.push("/handlekurv")}
                    className="btn-outline-dark"
                  >
                    Til handlekurv
                  </button>
                </div>
              </div>
            </Reveal>
          ) : (
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-12">
              {/* Form */}
              <Reveal>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <Section title="Kontaktinformasjon" step="01">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Fornavn" required name="firstName" type="text" />
                      <Field label="Etternavn" required name="lastName" type="text" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="E-post" required name="email" type="email" />
                      <Field label="Telefon" required name="phone" type="tel" />
                    </div>
                  </Section>

                  <Section title="Bedrift" step="02">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Bedriftsnavn" required name="company" type="text" />
                      <Field label="Org.nummer" name="orgnr" type="text" />
                    </div>
                    <div className="grid sm:grid-cols-[1fr_140px_1fr] gap-4">
                      <Field label="Adresse" required name="address" type="text" />
                      <Field label="Postnr." required name="zip" type="text" />
                      <Field label="Sted" required name="city" type="text" />
                    </div>
                  </Section>

                  <Section title="Tilleggsinformasjon" step="03">
                    <div>
                      <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
                        Ønsket leveringstid
                      </label>
                      <select
                        className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)]"
                        defaultValue=""
                      >
                        <option value="" disabled>Velg…</option>
                        <option>Snarest mulig</option>
                        <option>Innen 4 uker</option>
                        <option>Innen 8 uker</option>
                        <option>Senere / fleksibelt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
                        Behov for montering / opplæring?
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Fortell oss kort om prosjektet — eksisterende kjøkken, planløsning, tidsramme…"
                        className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] resize-none"
                      />
                    </div>
                    <label className="flex items-start gap-3 text-[13px] text-[var(--color-muted)] leading-[1.55]">
                      <input
                        type="checkbox"
                        required
                        className="mt-0.5 h-4 w-4 accent-[var(--color-copper)]"
                      />
                      <span>
                        Jeg samtykker til at TECNOX bruker informasjonen til å utarbeide et tilbud.
                      </span>
                    </label>
                  </Section>

                  <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto disabled:opacity-60">
                    {submitting ? "Sender…" : "Send tilbudsforespørsel"}
                  </button>
                </form>
              </Reveal>

              {/* Summary */}
              <Reveal delay={0.15}>
                <aside className="bg-[var(--color-dark-bg)] text-[var(--color-stone)] p-6 lg:p-8 rounded-[3px] lg:sticky lg:top-28">
                  <h3 className="text-[16px] font-bold text-white tracking-[-0.02em] uppercase tracking-[0.12em]">
                    Forespørsel
                  </h3>

                  <ul className="mt-6 divide-y divide-[var(--color-dark-border)]">
                    {detailedItems.map(({ product, qty, lineTotal }) => (
                      <li key={product.slug} className="py-4 flex gap-3 items-start">
                        <div className="relative h-12 w-12 shrink-0 bg-[oklch(0.21_0_0)] overflow-hidden rounded-[2px]">
                          <Image src={product.img} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white leading-snug">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-dark-muted)] mt-0.5">
                            {product.brand} · {qty} stk
                          </p>
                        </div>
                        <p className="text-[13px] font-mono text-[var(--color-copper)] whitespace-nowrap">
                          kr {formatNOK(lineTotal)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-5 pt-5 border-t border-[var(--color-dark-border)] space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-dark-muted)]">Antall</dt>
                      <dd>{itemCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-dark-muted)]">Sum (eks. MVA)</dt>
                      <dd className="font-mono">kr {formatNOK(subtotal)}</dd>
                    </div>
                  </dl>

                  <ul className="mt-6 space-y-3 text-[12px] text-[var(--color-dark-muted)]">
                    <li className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[var(--color-copper)]" /> Levering hele Norge
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[var(--color-copper)]" /> 2 års garanti
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--color-copper)]" /> Svar innen 24 t
                    </li>
                  </ul>
                </aside>
              </Reveal>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[var(--color-divider)] rounded-[3px] p-6 lg:p-8">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-[12px] font-mono text-[var(--color-copper)] tracking-[0.16em]">/{step}</span>
        <h3 className="text-[18px] font-bold text-[var(--color-ink)] tracking-[-0.02em]">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  name,
  type,
}: {
  label: string;
  required?: boolean;
  name: string;
  type: string;
}) {
  return (
    <div>
      <label className="block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-2">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full bg-white border border-[var(--color-divider)] px-4 py-3 text-[14px] rounded-[2px] focus:outline-none focus:border-[var(--color-copper)] transition-colors"
      />
    </div>
  );
}
