import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

export type Crumb = {
  label: string;
  to?: string;
};

interface PageHeroProps {
  label: string;
  title: ReactNode;
  description?: string;
  crumbs?: Crumb[];
  bgImage?: string | StaticImageData;
}

export function PageHero({ label, title, description, crumbs, bgImage }: PageHeroProps) {
  return (
    <section className="relative bg-[var(--color-stone)] text-[var(--color-ink)] border-b border-[var(--color-divider)] overflow-hidden">
      {/* Right-side image accent rather than full-bleed dark overlay */}
      {bgImage && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-1/2 hidden md:block pointer-events-none"
        >
          <div className="relative h-full w-full">
            <Image
              src={bgImage}
              alt=""
              fill
              className="object-cover opacity-90"
              sizes="50vw"
              priority={false}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--color-stone) 0%, oklch(0.965 0.012 85 / 0.6) 35%, transparent 100%)",
            }}
          />
        </div>
      )}

      {/* brand accent glow (TECNOX blue) */}
      <div
        className="absolute inset-0 opacity-[0.6] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 100%, oklch(0.72 0.12 236 / 0.1) 0%, transparent 45%)",
        }}
      />

      <div className="relative container-x pt-10 pb-10 lg:pt-12 lg:pb-14">
        {/* Breadcrumb */}
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Brødsmuler" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
              <li>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 hover:text-[var(--color-copper)] transition-colors"
                >
                  <Home className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="sr-only">Hjem</span>
                </Link>
              </li>
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                    <ChevronRight
                      className="h-3 w-3 text-[var(--color-muted)]/60"
                      strokeWidth={2}
                    />
                    {isLast || !c.to ? (
                      <span
                        className="text-[var(--color-ink)] font-medium"
                        aria-current={isLast ? "page" : undefined}
                      >
                        {c.label}
                      </span>
                    ) : (
                      <Link
                        href={c.to ?? "#"}
                        className="hover:text-[var(--color-copper)] transition-colors"
                      >
                        {c.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div className="max-w-[58%]">
          <Reveal>
            <span className="label-tag inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-copper)] inline-block" />
              {label}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1
              className="mt-4 max-w-3xl text-[var(--color-ink)] font-bold tracking-[-0.028em] leading-[1.05]"
              style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
            >
              {title}
            </h1>
          </Reveal>
          {description && (
            <Reveal delay={0.15}>
              <p className="mt-4 max-w-[560px] text-[15px] leading-[1.65] text-[var(--color-muted)]">
                {description}
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
