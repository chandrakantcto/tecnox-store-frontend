import Image from "next/image";
import Link from "next/link";
import { Linkedin, Instagram, Youtube } from "lucide-react";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

export function Footer({ locale = "nb" }: { locale?: Locale }) {
  const colKat: { label: string; to: string }[] = [
    { label: tr(locale, "Kok og stek", "Cook & fry"), to: "/produkter" },
    { label: tr(locale, "Kjøling", "Cooling"), to: "/produkter" },
    { label: tr(locale, "Oppvask", "Dishwashing"), to: "/produkter" },
    { label: tr(locale, "Kombidamp", "Combi ovens"), to: "/produkter" },
    { label: tr(locale, "Pizzautstyr", "Pizza equipment"), to: "/produkter" },
    { label: tr(locale, "Se alle →", "See all →"), to: "/kategorier" },
  ];

  const colSel: { label: string; to: string }[] = [
    { label: tr(locale, "Om oss", "About"), to: "/om-oss" },
    { label: tr(locale, "Service", "Service"), to: "/service" },
    { label: tr(locale, "Referanser", "References"), to: "/om-oss" },
    { label: tr(locale, "Karriere", "Careers"), to: "/om-oss" },
    { label: tr(locale, "Kontakt", "Contact"), to: "/kontakt" },
  ];

  return (
    <footer className="bg-[var(--color-dark-bg)] text-[var(--color-stone)]">
      <div className="container-x pt-16 lg:pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block leading-none">
              <Image
                src="/logo-tecno-x.webp"
                alt="TECNOX"
                className="h-[52px] sm:h-[56px] md:h-[60px] lg:h-[64px] w-auto max-w-[min(100%,380px)] object-contain object-left brightness-0 invert"
                width={380}
                height={70}
              />
            </Link>
            <p className="mt-3 text-[13px] text-[var(--color-dark-muted)] leading-[1.6] max-w-[240px]">
              {tr(locale, "Utstyr som jobber like hardt som du gjør.", "Equipment that works as hard as you do.")}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href="#" aria-label="LinkedIn" className="text-white hover:text-[var(--color-copper)] transition-colors">
                <Linkedin className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="Instagram" className="text-white hover:text-[var(--color-copper)] transition-colors">
                <Instagram className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="YouTube" className="text-white hover:text-[var(--color-copper)] transition-colors">
                <Youtube className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[13px] font-bold text-white mb-4">{tr(locale, "Kategorier", "Categories")}</h4>
            <ul className="space-y-2.5">
              {colKat.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.to}
                    className="text-[13px] text-[var(--color-dark-muted)] hover:text-[var(--color-copper)] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[13px] font-bold text-white mb-4">{tr(locale, "Selskapet", "Company")}</h4>
            <ul className="space-y-2.5">
              {colSel.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.to}
                    className="text-[13px] text-[var(--color-dark-muted)] hover:text-[var(--color-copper)] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[13px] font-bold text-white mb-4">{tr(locale, "Kontakt", "Contact")}</h4>
            <a href="tel:92222800" className="block text-[16px] font-bold text-[var(--color-copper)]">
              922 22 800
            </a>
            <a href="mailto:post@tecnox.no" className="mt-3 block text-[13px] text-[var(--color-dark-muted)] hover:text-[var(--color-copper)]">
              post@tecnox.no
            </a>
            <p className="mt-3 text-[13px] text-[var(--color-dark-muted)] leading-[1.6]">
              Adresseveien 1
              <br />
              0000 Oslo
            </p>
            <div className="mt-4 pt-4 border-t border-[var(--color-dark-border)] text-[12px] text-[var(--color-dark-muted)] leading-[1.7]">
              <p className="text-white/90 font-semibold uppercase tracking-[0.12em] text-[10px] mb-1.5">
                {tr(locale, "Åpningstider", "Opening hours")}
              </p>
              {tr(locale, "Man–fre 08:00–16:00", "Mon–Fri 08:00–16:00")}<br />
              {tr(locale, "Lør–søn stengt", "Sat–Sun closed")}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/handlekurv"
                className="text-[13px] text-[var(--color-dark-muted)] hover:text-[var(--color-copper)] transition-colors"
              >
                {tr(locale, "Handlekurv", "Cart")}
              </Link>
              <Link
                href="/kasse"
                className="text-[13px] text-[var(--color-dark-muted)] hover:text-[var(--color-copper)] transition-colors"
              >
                {tr(locale, "Tilbudsforespørsel", "Quote request")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-t border-[var(--color-dark-border)]">
        <div className="container-x py-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)] font-semibold">
            {["CE-merket", "NEMKO", "Energi A+", "Miljøfyrtårn", "ISO 9001"].map((c) => (
              <li key={c} className="px-2.5 py-1 border border-[var(--color-dark-border)] rounded-[2px]">
                {c}
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-dark-muted)] font-semibold">
            {["Faktura", "Visa", "Mastercard", "Vipps", "Leasing"].map((p) => (
              <li key={p} className="px-2.5 py-1 bg-[oklch(0.2_0_0)] rounded-[2px]">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--color-dark-border)]">
        <div className="container-x py-5 flex flex-col md:flex-row gap-3 md:gap-6 md:items-center md:justify-between">
          <p className="text-[12px] text-[oklch(0.5_0.005_60)]">
            {tr(
              locale,
              "© 2026 TECNOX AS  ·  Org.nr. 000 000 000  ·  Alle priser eks. MVA",
              "© 2026 TECNOX AS  ·  Org.no. 000 000 000  ·  All prices excl. VAT",
            )}
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            {tr(
              locale,
              ["Personvern", "Vilkår", "Informasjonskapsler"],
              ["Privacy", "Terms", "Cookies"],
            ).map((l) => (
              <li key={l}>
                <a href="#" className="text-[oklch(0.5_0.005_60)] hover:text-[var(--color-copper)] transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
