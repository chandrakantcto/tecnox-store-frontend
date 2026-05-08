"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, ShoppingBag, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getMegaMenuTree } from "@/data/megaMenu";
import { getClientLocale, type Locale, setClientLocale, tr } from "@/lib/locale";

const NAV_LINKS = [
  { nb: "Hjem", en: "Home", href: "/" as const },
  { nb: "Produkter", en: "Products", href: "/produkter" as const, mega: true },
  { nb: "Kategorier", en: "Categories", href: "/kategorier" as const },
  { nb: "Service", en: "Service", href: "/service" as const },
  { nb: "Om oss", en: "About", href: "/om-oss" as const },
  { nb: "Kontakt", en: "Contact", href: "/kontakt" as const },
];

function pickFirstSubWithChildren(mainId: string, megaMenuTree: ReturnType<typeof getMegaMenuTree>) {
  const main = megaMenuTree.find((m) => m.id === mainId);
  return main?.subs.find((s) => s.children && s.children.length > 0)?.id ?? null;
}

const MEGA_CLOSE_MS = 140;

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("nb");
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaMainId, setMegaMainId] = useState<string | null>(null);
  const [megaSubId, setMegaSubId] = useState<string | null>(null);
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { itemCount } = useCart();
  const megaMenuTree = useMemo(() => getMegaMenuTree(locale), [locale]);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const cancelMegaCloseTimer = () => {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
  };

  useEffect(() => () => cancelMegaCloseTimer(), []);

  const scheduleMegaClose = () => {
    cancelMegaCloseTimer();
    megaCloseTimer.current = setTimeout(() => {
      setMegaOpen(false);
      setMegaSubId(null);
      megaCloseTimer.current = null;
    }, MEGA_CLOSE_MS);
  };

  const activeMain = useMemo(
    () => megaMenuTree.find((m) => m.id === megaMainId) ?? megaMenuTree[0],
    [megaMainId, megaMenuTree],
  );
  const activeSub = useMemo(
    () => activeMain?.subs.find((s) => s.id === megaSubId),
    [activeMain, megaSubId],
  );

  const openMega = () => {
    cancelMegaCloseTimer();
    const first = megaMenuTree[0];
    if (!first) return;
    setMegaOpen(true);
    setMegaMainId(first.id);
    setMegaSubId(pickFirstSubWithChildren(first.id, megaMenuTree));
  };

  const closeMega = () => {
    cancelMegaCloseTimer();
    setMegaOpen(false);
    setMegaSubId(null);
  };

  const onMainEnter = (mainId: string) => {
    setMegaMainId(mainId);
    setMegaSubId(pickFirstSubWithChildren(mainId, megaMenuTree));
  };

  const setSiteLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    setClientLocale(nextLocale);
    setLocale(nextLocale);
    router.refresh();
  };

  return (
    <nav className="bg-[var(--color-stone)] border-b border-[var(--color-divider)] relative">
      <div className="container-x flex items-center gap-4 py-2 sm:py-3">
        <div className="flex min-w-0 flex-1 justify-start">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo-tecno-x.webp"
              alt="TECNOX"
              className="h-[52px] sm:h-[56px] md:h-[60px] lg:h-[64px] w-auto max-w-[min(100%,380px)] object-contain object-left"
              width={380}
              height={70}
              priority
            />
          </Link>
        </div>

        {/* Desktop nav + mega: centered between logo and actions */}
        <div className="relative hidden min-w-0 shrink-0 lg:flex lg:justify-center">
          <ul className="flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
              <li
                key={link.href}
                className="relative"
                onMouseEnter={() => link.mega && openMega()}
                onMouseLeave={() => link.mega && scheduleMegaClose()}
              >
                <Link
                  href={link.href}
                  data-active={isActive ? "true" : "false"}
                  className="nav-link inline-flex items-center gap-1"
                >
                  {tr(locale, link.nb, link.en)}
                  {link.mega && <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={2} />}
                </Link>
              </li>
              );
            })}
          </ul>

          {megaOpen && (
            <div
              className="absolute left-1/2 top-full z-70 -translate-x-1/2 pt-8  animate-fade-in"
              onMouseEnter={() => {
                cancelMegaCloseTimer();
                setMegaOpen(true);
              }}
              onMouseLeave={scheduleMegaClose}
            >
              <div className="w-[min(100vw-48px,1200px)] p-7 shrink-0 border border-[var(--color-divider)] rounded-[3px] overflow-hidden bg-white shadow-[0_24px_40px_-20px_oklch(0.18_0.005_60/0.18)]">
                <div className="grid min-h-[min(320px,50vh)] grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)] gap-0">
                  {/* Kolonne 1 — hovedkategorier */}
                  <div className="border-r border-[var(--color-divider)] bg-[var(--color-stone)]/40">
                    <ul className="py-2 max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain">
                      {megaMenuTree.map((main) => (
                        <li key={main.id}>
                          <button
                            type="button"
                            className={`w-full text-left flex items-center justify-between gap-2 px-4 py-3 text-[13.5px] font-medium transition-colors border-l-[3px] ${
                              megaMainId === main.id
                                ? "border-[var(--color-copper)] bg-white text-[var(--color-copper)]"
                                : "border-transparent text-[var(--color-ink)] hover:bg-white/80 hover:text-[var(--color-copper)]"
                            }`}
                            onMouseEnter={() => onMainEnter(main.id)}
                          >
                            <span className="min-w-0 truncate">{main.label}</span>
                            <span className="flex items-center gap-1 shrink-0">
                              <span className="text-[11px] text-[var(--color-muted)] tabular-nums">{main.count}</span>
                              <ChevronRight className="h-3.5 w-3.5 opacity-50" strokeWidth={2} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Kolonne 2 — underkategorier */}
                  <div className="border-r border-[var(--color-divider)] bg-white pl-5">
                    <ul className="py-2 max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain">
                      {activeMain?.subs.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href="/produkter"
                            onMouseEnter={() => setMegaSubId(sub.id)}
                            onClick={closeMega}
                            className={`flex items-center justify-between gap-2 px-4 py-2.5 text-[13px] transition-colors border-l-[3px] ${
                              megaSubId === sub.id
                                ? "border-[var(--color-copper)] bg-[var(--color-stone)]/35 text-[var(--color-copper)] font-medium"
                                : "border-transparent text-[var(--color-ink)] hover:bg-[var(--color-stone)]/50 hover:text-[var(--color-copper)]"
                            }`}
                          >
                            <span className="min-w-0 truncate">{sub.label}</span>
                            {sub.children && sub.children.length > 0 && (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-45" strokeWidth={2} />
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Kolonne 3 — under-underkategorier */}
                  <div className="bg-white">
                    <ul className="py-2 max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain">
                      {activeSub?.children && activeSub.children.length > 0 ? (
                        activeSub.children.map((leaf) => (
                          <li key={leaf.id}>
                            <Link
                              href="/produkter"
                              onClick={closeMega}
                              className="block px-4 py-2.5 text-[13px] text-[var(--color-ink)] border-l-[3px] border-transparent hover:border-[var(--color-copper)] hover:bg-[var(--color-stone)]/35 hover:text-[var(--color-copper)] transition-colors"
                            >
                              {leaf.label}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-8">
                          <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">
                            {tr(
                              locale,
                              "Velg en underkategori med pil til venstre for å se flere valg her.",
                              "Choose a subcategory with an arrow to the left to see more options here.",
                            )}
                          </p>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 shrink-0 items-center justify-end gap-5">
          <div className="hidden sm:inline-flex items-center rounded-[2px] border border-[var(--color-divider)] overflow-hidden">
            <button
              type="button"
              onClick={() => setSiteLocale("nb")}
              className={`px-2 py-1 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                locale === "nb"
                  ? "bg-[var(--color-copper)] text-white"
                  : "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`}
              aria-label="Bytt til norsk"
            >
              NB
            </button>
            <button
              type="button"
              onClick={() => setSiteLocale("en")}
              className={`px-2 py-1 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                locale === "en"
                  ? "bg-[var(--color-copper)] text-white"
                  : "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
          </div>
          <button
            aria-label={tr(locale, "Søk", "Search")}
            className="hidden sm:block text-[var(--color-ink)] hover:text-[var(--color-copper)] transition-colors"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <button
            aria-label={tr(locale, "Min konto", "My account")}
            className="hidden sm:block text-[var(--color-ink)] hover:text-[var(--color-copper)] transition-colors"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <Link
            href="/handlekurv"
            aria-label={tr(locale, "Handlekurv", "Cart")}
            className="relative text-[var(--color-ink)] hover:text-[var(--color-copper)] transition-colors"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="absolute -top-1.5 -right-2 bg-[var(--color-copper)] text-white text-[10px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-[2px]">
              {itemCount}
            </span>
          </Link>
          <button
            aria-label={tr(locale, "Meny", "Menu")}
            className="lg:hidden text-[var(--color-ink)] ml-1"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-[var(--color-divider)] bg-[var(--color-stone)] animate-fade-in">
          <ul className="container-x py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-[15px] text-[var(--color-ink)] border-b border-[var(--color-divider)] hover:text-[var(--color-copper)]"
                >
                  {tr(locale, link.nb, link.en)}
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <div className="inline-flex items-center rounded-[2px] border border-[var(--color-divider)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSiteLocale("nb")}
                  className={`px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                    locale === "nb"
                      ? "bg-[var(--color-copper)] text-white"
                      : "bg-transparent text-[var(--color-muted)]"
                  }`}
                >
                  NB
                </button>
                <button
                  type="button"
                  onClick={() => setSiteLocale("en")}
                  className={`px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] transition-colors ${
                    locale === "en"
                      ? "bg-[var(--color-copper)] text-white"
                      : "bg-transparent text-[var(--color-muted)]"
                  }`}
                >
                  EN
                </button>
              </div>
            </li>
            <li>
              <Link
                href="/handlekurv"
                onClick={() => setOpen(false)}
                className="block py-3 text-[15px] text-[var(--color-copper)] border-b border-[var(--color-divider)]"
              >
                {tr(locale, "Handlekurv", "Cart")} ({itemCount})
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
