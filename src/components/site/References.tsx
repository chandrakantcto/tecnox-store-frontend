import Image from "next/image";
import { Reveal } from "./Reveal";
import refRestaurant from "@/assets/ref-restaurant.jpg";
import refHotell from "@/assets/ref-hotell.jpg";
import refKantine from "@/assets/ref-kantine.jpg";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const REFS = [
  {
    nameNb: "Solberg & Hansen",
    nameEn: "Solberg & Hansen",
    typeNb: "Restaurant · Bergen",
    typeEn: "Restaurant - Bergen",
    quoteNb: "Profesjonell montering og god oppfølging i etterkant.",
    quoteEn: "Professional installation and excellent follow-up afterwards.",
    img: refRestaurant,
  },
  {
    nameNb: "Scandic Hotels",
    nameEn: "Scandic Hotels",
    typeNb: "Hotellkjede · Hele Norge",
    typeEn: "Hotel chain - Nationwide",
    quoteNb: "En leverandør vi stoler på — år etter år.",
    quoteEn: "A supplier we trust - year after year.",
    img: refHotell,
  },
  {
    nameNb: "Universitetet i Oslo",
    nameEn: "University of Oslo",
    typeNb: "Kantine · Oslo",
    typeEn: "Canteen - Oslo",
    quoteNb: "Komplett løsning fra tegning til innkjøring på rekordtid.",
    quoteEn: "Complete solution from design to commissioning in record time.",
    img: refKantine,
  },
];

export function References({ locale = "nb" }: { locale?: Locale }) {
  return (
    <section className="bg-[var(--color-stone)] section-pad">
      <div className="container-x">
        <Reveal>
          <div className="max-w-3xl mb-14">
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {tr(locale, "Referanser", "References")}
            </span>
            <h2 className="display-h2 mt-5 text-[var(--color-ink)]">
              {tr(locale, "Kjøkken vi er stolte av.", "Kitchens we are proud of.")}
            </h2>
            <p className="mt-5 text-[16px] text-[var(--color-muted)] leading-[1.6] max-w-[560px]">
              {tr(
                locale,
                "Et utvalg av virksomhetene som har valgt oss som sin leverandør.",
                "A selection of businesses that have chosen us as their supplier.",
              )}
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {REFS.map((r, i) => (
            <Reveal key={r.nameNb} delay={i * 0.12}>
              <article className="card-elevated group cursor-pointer h-full">
                <div className="aspect-[16/9] overflow-hidden relative">
                  <Image
                    src={r.img}
                    alt={`${tr(locale, r.nameNb, r.nameEn)} - ${tr(locale, r.typeNb, r.typeEn)}`}
                    loading="lazy"
                    width={1280}
                    height={720}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute top-3 left-3 text-[10px] font-mono text-white/80 tracking-[0.1em] bg-[oklch(0.155_0_0/0.5)] backdrop-blur-sm px-2 py-1 rounded-[2px]">
                    /KASE {String(i + 1).padStart(2, "0")}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-[17px] font-bold text-[var(--color-ink)] tracking-[-0.015em]">
                    {tr(locale, r.nameNb, r.nameEn)}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-[var(--color-copper)] uppercase tracking-[0.14em] font-semibold">
                    {tr(locale, r.typeNb, r.typeEn)}
                  </p>
                  <p className="mt-5 text-[14px] italic text-[var(--color-muted)] leading-[1.65] border-l-2 border-[var(--color-copper)] pl-3.5">
                    &ldquo;{tr(locale, r.quoteNb, r.quoteEn)}&rdquo;
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
