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

const ACCOUNT_PAGE_INTERACTIVE =
  "[&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

const nav = (locale: Locale) =>
  [
    { href: "/konto", nb: "Kontrollpanel", en: "Dashboard" },
    { href: "/konto/ordrer", nb: "Bestillinger", en: "Orders" },
    { href: "/konto/adresser", nb: "Adresser", en: "Addresses" },
    { href: "/konto/profil", nb: "Kontodetaljer", en: "Account details" },
    { href: "/konto/passord", nb: "Passord", en: "Password" },
  ] as const;

function isNavActive(pathname: string | null, href: string): boolean {
  if (href === "/konto") return pathname === "/konto";
  if (href === "/konto/ordrer") {
    return pathname === href || Boolean(pathname?.startsWith("/konto/ordrer/"));
  }
  return pathname === href;
}

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
      <main className={` bg-[var(--color-stone)] ${ACCOUNT_PAGE_INTERACTIVE}`}>
        <TopBar />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
        <p className="container-x py-24 text-center text-[var(--color-muted)]">
          {tr(lc, "Laster konto …", "Loading account …")}
        </p>
        <Footer locale={lc} />
      </main>
    );
  }

  if (!customer) {
    return (
      <main className={` bg-[var(--color-stone)] ${ACCOUNT_PAGE_INTERACTIVE}`}>
        <TopBar />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
        <p className="container-x py-24 text-center text-[var(--color-muted)]">
          {tr(lc, "Omdirigerer til innlogging …", "Redirecting to sign in …")}
        </p>
        <Footer locale={lc} />
      </main>
    );
  }

  return (
    <main className={` bg-[var(--color-stone)] ${ACCOUNT_PAGE_INTERACTIVE}`}>
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>
      <div className="container-x py-10 lg:py-12">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
          <nav
            aria-label={tr(lc, "Kontomeny", "Account menu")}
            className="mb-8 rounded-[3px] border border-[var(--color-divider)] bg-white p-3 lg:sticky lg:top-40 lg:mb-0"
          >
            <ul className="space-y-1">
              {nav(lc).map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-[3px] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                        active
                          ? "bg-[var(--color-copper)] text-white"
                          : "text-[var(--color-ink)] hover:bg-[var(--color-stone)]"
                      }`}
                    >
                      {tr(lc, item.nb, item.en)}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-2 border-t border-[var(--color-divider)] pt-2">
                <button
                  type="button"
                  onClick={() => void logout().then(() => router.push("/"))}
                  className="block w-full rounded-[3px] px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-stone)]"
                >
                  {tr(lc, "Logg ut", "Log out")}
                </button>
              </li>
            </ul>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <Footer locale={lc} />
    </main>
  );
}
