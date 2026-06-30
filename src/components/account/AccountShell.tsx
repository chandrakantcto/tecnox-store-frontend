"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShoppingBag,
  User,
} from "lucide-react";
import { Footer } from "@/components/site/Footer";
import { megaMenuToFooterRoots } from "@/lib/vendure/catalog-data";
import { MainNav } from "@/components/site/MainNav";
import { TopBar } from "@/components/site/TopBar";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { type Locale, tr } from "@/lib/locale";

const ACCOUNT_PAGE_INTERACTIVE =
  "[&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer";

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

const nav = (locale: Locale) =>
  [
    { href: "/konto", nb: "Kontrollpanel", en: "Dashboard", icon: LayoutDashboard },
    { href: "/konto/ordrer", nb: "Bestillinger", en: "Orders", icon: ShoppingBag },
    { href: "/konto/adresser", nb: "Adresser", en: "Addresses", icon: MapPin },
    { href: "/konto/profil", nb: "Kontodetaljer", en: "Account details", icon: User },
    { href: "/konto/passord", nb: "Endre passord", en: "Change Password", icon: KeyRound },
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
  const { customer, initializing, logout } = useShopAuth();
  const lc = useActiveLocale();

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
        <Footer locale={lc} rootCategories={megaMenuToFooterRoots(megaMenuByLocale)} />
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
        <Footer locale={lc} rootCategories={megaMenuToFooterRoots(megaMenuByLocale)} />
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
            className="mb-8 rounded-[3px] border border-[var(--color-divider)] bg-white p-3 shadow-[var(--shadow-card)] lg:sticky lg:top-40 lg:mb-0"
          >
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              {tr(lc, "Min konto", "My account")}
            </p>
            <ul className="space-y-1">
              {nav(lc).map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                        active
                          ? "bg-[var(--color-copper)] text-white"
                          : "text-[var(--color-ink)] hover:bg-[var(--color-stone)]"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      {tr(lc, item.nb, item.en)}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-2 border-t border-[var(--color-divider)] pt-2">
                <button
                  type="button"
                  onClick={() => void logout().then(() => router.push("/"))}
                  className="flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-stone)]"
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {tr(lc, "Logg ut", "Log out")}
                </button>
              </li>
            </ul>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <Footer locale={lc} rootCategories={megaMenuToFooterRoots(megaMenuByLocale)} />
    </main>
  );
}
