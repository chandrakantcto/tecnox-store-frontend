"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { MainNav } from "@/components/site/MainNav";
import { TopBar } from "@/components/site/TopBar";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { type Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

const nav = (locale: Locale) =>
  [
    { href: "/konto", nb: "Oversikt", en: "Dashboard" },
    { href: "/konto/profil", nb: "Profil", en: "Profile" },
    { href: "/konto/passord", nb: "Bytt passord", en: "Change password" },
    { href: "/konto/ordrer", nb: "Mine ordrer", en: "Order history" },
  ] as const;

export function AccountShell({
  children,
  megaMenuByLocale = EMPTY_MEGA,
}: {
  children: ReactNode;
  megaMenuByLocale?: MegaMenuLocales;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { customer, initializing, logout, locale } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";

  useEffect(() => {
    if (!initializing && !customer && pathname?.startsWith("/konto")) {
      const next = pathname || "/konto";
      router.replace(`/logg-inn?next=${encodeURIComponent(next)}`);
    }
  }, [customer, initializing, pathname, router]);

  if (initializing) {
    return (
      <main className="min-h-screen bg-[var(--color-stone)]">
        <TopBar locale={lc} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
        <p className="container-x py-24 text-center text-[var(--color-muted)]">
          {tr(lc, "Laster konto …", "Loading account …")}
        </p>
        <Footer />
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen bg-[var(--color-stone)]">
        <TopBar locale={lc} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
        <p className="container-x py-24 text-center text-[var(--color-muted)]">
          {tr(lc, "Omdirigerer til innlogging …", "Redirecting to sign in …")}
        </p>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar locale={lc} />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>
      <section className="border-b border-[var(--color-divider)] bg-white">
        <div className="container-x flex flex-col gap-4 py-10 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div>
            <p className="font-mono text-[12px] tracking-[0.16em] text-[var(--color-copper)]">/KONTO</p>
            <h1 className="display-h3 mt-2 text-[var(--color-ink)]">
              {tr(lc, "Min konto", "My account")}
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-muted)]">{customer.emailAddress}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout().then(() => router.push("/"))}
            className="btn-outline-dark self-start"
          >
            {tr(lc, "Logg ut", "Log out")}
          </button>
        </div>
      </section>
      <div className="container-x py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        <nav className="mb-8 space-y-1 lg:mb-0">
          {nav(lc).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-[2px] px-3 py-2 text-[14px] ${
                pathname === item.href || (item.href === "/konto/ordrer" && pathname?.startsWith("/konto/ordrer")) ?
                  "bg-[var(--color-ink)] text-white"
                : "text-[var(--color-ink)] hover:bg-white"
              }`}
            >
              {tr(lc, item.nb, item.en)}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
      <Footer />
    </main>
  );
}
