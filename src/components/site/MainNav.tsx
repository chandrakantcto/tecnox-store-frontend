"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, ShoppingBag, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useCartItemCount } from "@/contexts/CartContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import type { MegaMain } from "@/data/megaMenu";
import { useStorefrontSearch } from "@/hooks/use-storefront-search";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { type Locale, tr } from "@/lib/locale";
import { CartSidebar } from "@/components/site/CartSidebar";
import { NavSearchDesktop, NavSearchMobile } from "@/components/site/NavSearch";

const NAV_LINKS = [
  { nb: "Hjem", en: "Home", href: "/" as const },
  { nb: "Produkter", en: "Products", href: "/produkter" as const, mega: true },
  { nb: "Kategorier", en: "Categories", href: "/kategorier" as const },
  { nb: "Service", en: "Service", href: "/service" as const },
  { nb: "Om oss", en: "About", href: "/om-oss" as const },
  { nb: "Kontakt", en: "Contact", href: "/kontakt" as const },
];

const EMPTY_MEGA: MegaMenuLocales = { nb: [], en: [] };

function catHref(collectionSlug: string) {
  return `/produkter?cat=${encodeURIComponent(collectionSlug)}`;
}

function pickFirstSubWithChildren(mainCollectionId: string, megaMenuTree: MegaMain[]) {
  const main = megaMenuTree.find((m) => m.collectionId === mainCollectionId);
  return main?.subs.find((s) => s.children && s.children.length > 0)?.collectionId ?? null;
}

const MEGA_CLOSE_MS = 140;

function UserAccountMenu({ locale, authCustomer }: { locale: Locale; authCustomer: unknown }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useShopAuth();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const itemClass =
    "block w-full px-4 py-2.5 text-left text-[13px] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-stone)] hover:text-[var(--color-copper)] cursor-pointer";

  const handleLogout = () => {
    setOpen(false);
    void logout().then(() => router.push("/"));
  };

  return (
    <div ref={menuRef} className="relative hidden sm:flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          authCustomer ? tr(locale, "Min konto", "My account") : tr(locale, "Konto", "Account")
        }
        className="text-[var(--color-ink)] transition-colors hover:text-[var(--color-copper)] cursor-pointer"
      >
        <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[190px] rounded-[3px] border border-[var(--color-divider)] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {authCustomer ? (
            <>
              <Link href="/konto" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                {tr(locale, "Min konto", "My account")}
              </Link>
              <Link href="/konto/ordrer" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                {tr(locale, "Bestillinger", "Orders")}
              </Link>
              <button type="button" role="menuitem" onClick={handleLogout} className={itemClass}>
                {tr(locale, "Logg ut", "Log out")}
              </button>
            </>
          ) : (
            <>
              <Link href="/logg-inn" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                {tr(locale, "Logg inn", "Sign in")}
              </Link>
              <Link href="/registrer" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                {tr(locale, "Registrer", "Register")}
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function MainNav({ megaMenuByLocale = EMPTY_MEGA }: { megaMenuByLocale?: MegaMenuLocales }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale: setSiteLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileMegaMainId, setMobileMegaMainId] = useState<string | null>(null);
  const [mobileMegaSubId, setMobileMegaSubId] = useState<string | null>(null);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaMainId, setMegaMainId] = useState<string | null>(null);
  const [megaSubId, setMegaSubId] = useState<string | null>(null);
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemCount = useCartItemCount();
  const { customer: authCustomer, logout } = useShopAuth();
  const megaMenuTree = useMemo(() => {
    const pick = megaMenuByLocale[locale];
    if (pick?.length) return pick;
    if (megaMenuByLocale.nb.length) return megaMenuByLocale.nb;
    return megaMenuByLocale.en;
  }, [locale, megaMenuByLocale]);

  const storefrontSearch = useStorefrontSearch(locale, megaMenuTree);

  useEffect(() => {
    if (!open) {
      setMobileProductsOpen(false);
      setMobileMegaMainId(null);
      setMobileMegaSubId(null);
    }
  }, [open]);

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
    () => megaMenuTree.find((m) => m.collectionId === megaMainId) ?? megaMenuTree[0],
    [megaMainId, megaMenuTree],
  );
  const activeSub = useMemo(
    () => activeMain?.subs.find((s) => s.collectionId === megaSubId),
    [activeMain, megaSubId],
  );

  const openMega = () => {
    cancelMegaCloseTimer();
    const first = megaMenuTree[0];
    if (!first) return;
    setMegaOpen(true);
    setMegaMainId(first.collectionId);
    setMegaSubId(pickFirstSubWithChildren(first.collectionId, megaMenuTree));
  };

  const closeMega = () => {
    cancelMegaCloseTimer();
    setMegaOpen(false);
    setMegaSubId(null);
  };

  const onMainEnter = (mainCollectionId: string) => {
    setMegaMainId(mainCollectionId);
    setMegaSubId(pickFirstSubWithChildren(mainCollectionId, megaMenuTree));
  };

  return (
    <nav className="bg-[var(--color-stone)] border-b border-[var(--color-divider)] relative">
      <div className="container-x flex items-center gap-4 py-2 sm:py-3">
        <div className="flex min-w-0 flex-1 justify-start">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo-tecno-x.webp"
              alt="TECNOX"
              className="h-[52px] sm:h-[50px] md:h-[60px] lg:h-[64px] w-auto max-w-[min(100%,380px)] object-contain object-left"
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

          {megaOpen && megaMenuTree.length > 0 && (
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
                        <li key={main.collectionId}>
                          <button
                            type="button"
                            className={`w-full text-left flex items-center justify-between gap-2 px-4 py-3 text-[13.5px] font-medium transition-colors border-l-[3px] ${
                              megaMainId === main.collectionId
                                ? "border-[var(--color-copper)] bg-white text-[var(--color-copper)]"
                                : "border-transparent text-[var(--color-ink)] hover:bg-white/80 hover:text-[var(--color-copper)]"
                            }`}
                            onMouseEnter={() => onMainEnter(main.collectionId)}
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
                        <li key={sub.collectionId}>
                          <Link
                            href={catHref(sub.id)}
                            onMouseEnter={() => setMegaSubId(sub.collectionId)}
                            onClick={closeMega}
                            className={`flex items-center justify-between gap-2 px-4 py-2.5 text-[13px] transition-colors border-l-[3px] ${
                              megaSubId === sub.collectionId
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
                          <li key={leaf.collectionId}>
                            <Link
                              href={catHref(leaf.id)}
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
          <div className="hidden lg:inline-flex items-center rounded-[2px] border border-[var(--color-divider)] overflow-hidden">
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
          <NavSearchDesktop locale={locale} search={storefrontSearch} />
          <UserAccountMenu locale={locale} authCustomer={authCustomer} />
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={tr(locale, "Handlekurv", "Cart")}
            className="relative text-[var(--color-ink)] hover:text-[var(--color-copper)] transition-colors cursor-pointer"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="absolute -top-1.5 -right-2 bg-[var(--color-copper)] text-white text-[10px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-[2px]">
              {itemCount}
            </span>
          </button>
          <button
            aria-label={tr(locale, "Meny", "Menu")}
            className="lg:hidden text-[var(--color-ink)] ml-1 cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-[var(--color-divider)] bg-[var(--color-stone)] animate-fade-in">
          <div className="container-x pt-4">
            <NavSearchMobile
              locale={locale}
              search={storefrontSearch}
              onResultPick={() => setOpen(false)}
            />
          </div>
          <ul className="container-x py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              if (link.mega) {
                return (
                  <li key={link.href}>
                    <button
                      type="button"
                      onClick={() => {
                        if (megaMenuTree.length === 0) {
                          router.push(link.href);
                          setOpen(false);
                          return;
                        }
                        setMobileProductsOpen((v) => !v);
                      }}
                      aria-expanded={mobileProductsOpen}
                      className="flex w-full items-center justify-between gap-2 border-b border-[var(--color-divider)] py-3 text-left text-[15px] text-[var(--color-ink)] hover:text-[var(--color-copper)]"
                    >
                      <span>{tr(locale, link.nb, link.en)}</span>
                      {megaMenuTree.length > 0 ? (
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`}
                          strokeWidth={2}
                        />
                      ) : null}
                    </button>

                    {mobileProductsOpen && megaMenuTree.length > 0 ? (
                      <div className="border-b border-[var(--color-divider)] pb-3 pt-2">
                        <nav
                          aria-label={tr(locale, "Produktkategorier", "Product categories")}
                          className="rounded-[3px] border border-[var(--color-divider)] bg-[oklch(0.98_0.005_80)] p-1"
                        >
                          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                            {tr(locale, "Kategori", "Category")}
                          </p>
                          <div className="flex flex-col gap-0.5">
                            {megaMenuTree.map((main) => {
                              const mainOpen = mobileMegaMainId === main.collectionId;
                              return (
                                <div key={main.collectionId}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMobileMegaMainId((id) => (id === main.collectionId ? null : main.collectionId));
                                      setMobileMegaSubId(null);
                                    }}
                                    className={`flex w-full items-center justify-between gap-2 rounded-[3px] border px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                                      mainOpen
                                        ? "border-[var(--color-divider)] border-l-[3px] border-l-[var(--color-copper)] bg-white text-[var(--color-ink)] shadow-sm"
                                        : "border-transparent text-[var(--color-muted)] hover:bg-white/70 hover:text-[var(--color-ink)]"
                                    }`}
                                  >
                                    <span className="min-w-0 truncate">{main.label}</span>
                                    <span className="flex shrink-0 items-center gap-1 tabular-nums text-[11px] font-normal text-[var(--color-muted)]">
                                      ({main.count})
                                      <ChevronRight
                                        className={`h-3.5 w-3.5 opacity-50 transition-transform ${mainOpen ? "rotate-90" : ""}`}
                                        strokeWidth={2}
                                      />
                                    </span>
                                  </button>

                                  {mainOpen ? (
                                    <ul className="mt-0.5 flex flex-col gap-0.5 border-l border-[var(--color-divider)] py-1 pl-2 ml-2">
                                      {main.subs.map((sub) => {
                                        const hasChildren = Boolean(sub.children && sub.children.length > 0);
                                        const subOpen = mobileMegaSubId === sub.collectionId;
                                        return (
                                          <li key={sub.collectionId}>
                                            {hasChildren ? (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setMobileMegaSubId((id) => (id === sub.collectionId ? null : sub.collectionId))
                                                  }
                                                  className={`flex w-full items-center justify-between gap-2 rounded-[3px] px-3 py-2 text-left text-[13px] transition-colors ${
                                                    subOpen
                                                      ? "bg-white/90 font-medium text-[var(--color-copper)]"
                                                      : "text-[var(--color-ink)] hover:bg-white/70 hover:text-[var(--color-copper)]"
                                                  }`}
                                                >
                                                  <span className="min-w-0 truncate">{sub.label}</span>
                                                  <ChevronRight
                                                    className={`h-3.5 w-3.5 shrink-0 opacity-45 transition-transform ${subOpen ? "rotate-90" : ""}`}
                                                    strokeWidth={2}
                                                  />
                                                </button>
                                                {subOpen ? (
                                                  <ul className="flex flex-col gap-0.5 py-1 pl-2">
                                                    {sub.children!.map((leaf) => (
                                                      <li key={leaf.collectionId}>
                                                        <Link
                                                          href={catHref(leaf.id)}
                                                          onClick={() => setOpen(false)}
                                                          className="block rounded-[3px] px-3 py-2 text-[12.5px] text-[var(--color-ink)] hover:bg-white/80 hover:text-[var(--color-copper)]"
                                                        >
                                                          {leaf.label}
                                                        </Link>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                ) : null}
                                              </>
                                            ) : (
                                              <Link
                                                href={catHref(sub.id)}
                                                onClick={() => setOpen(false)}
                                                className="block rounded-[3px] px-3 py-2 text-[13px] text-[var(--color-ink)] hover:bg-white/80 hover:text-[var(--color-copper)]"
                                              >
                                                {sub.label}
                                              </Link>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </nav>
                      </div>
                    ) : null}
                  </li>
                );
              }

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-[15px] text-[var(--color-ink)] border-b border-[var(--color-divider)] hover:text-[var(--color-copper)]"
                  >
                    {tr(locale, link.nb, link.en)}
                  </Link>
                </li>
              );
            })}
            {authCustomer ? (
              <>
                <li>
                  <Link
                    href="/konto"
                    onClick={() => setOpen(false)}
                    className="block py-3 text-[15px] text-[var(--color-ink)] border-b border-[var(--color-divider)] hover:text-[var(--color-copper)]"
                  >
                    {tr(locale, "Min konto", "My account")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/konto/ordrer"
                    onClick={() => setOpen(false)}
                    className="block py-3 text-[15px] text-[var(--color-ink)] border-b border-[var(--color-divider)] hover:text-[var(--color-copper)]"
                  >
                    {tr(locale, "Bestillinger", "Orders")}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void logout().then(() => router.push("/"));
                    }}
                    className="block w-full py-3 text-left text-[15px] text-[var(--color-ink)] border-b border-[var(--color-divider)] hover:text-[var(--color-copper)] cursor-pointer"
                  >
                    {tr(locale, "Logg ut", "Log out")}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/logg-inn"
                    onClick={() => setOpen(false)}
                    className="block py-3 text-[15px] text-[var(--color-ink)] border-b border-[var(--color-divider)] hover:text-[var(--color-copper)]"
                  >
                    {tr(locale, "Logg inn", "Sign in")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/registrer"
                    onClick={() => setOpen(false)}
                    className="block py-3 text-[15px] text-[var(--color-ink)] border-b border-[var(--color-divider)] hover:text-[var(--color-copper)]"
                  >
                    {tr(locale, "Registrer", "Register")}
                  </Link>
                </li>
              </>
            )}
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

      <CartSidebar open={cartOpen} onOpenChange={setCartOpen} locale={locale} />
    </nav>
  );
}
