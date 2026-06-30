"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  KeyRound,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";
import {
  formatOrderDate,
  formatOrderTotalSummary,
  orderStateLabel,
  orderStateTone,
} from "@/components/account/account-order-utils";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { tr, type Locale } from "@/lib/locale";
import { parseStoredPhone } from "@/lib/phone/phone-format";
import { errorMessageFromShopResult, shopGraphql } from "@/lib/vendure/shop-client-browser";
import { GQL_ACTIVE_CUSTOMER_PANEL, GQL_CUSTOMER_ORDER_LIST } from "@/lib/vendure/shop-auth-documents";

type OrderPreview = {
  id: string;
  code: string;
  state: string;
  orderPlacedAt: string | null;
  createdAt: string | null;
  totalWithTax: unknown;
  totalQuantity: number;
};

type CustomerAddress = {
  streetLine1: string;
  postalCode: string;
  city: string;
  defaultBillingAddress: boolean;
  defaultShippingAddress: boolean;
};

function parseAddresses(raw: unknown): CustomerAddress[] {
  if (!raw || typeof raw !== "object") return [];
  const items = (raw as { addresses?: unknown }).addresses;
  if (!Array.isArray(items)) return [];
  const out: CustomerAddress[] = [];
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const a = row as Record<string, unknown>;
    out.push({
      streetLine1: typeof a.streetLine1 === "string" ? a.streetLine1 : "",
      postalCode: typeof a.postalCode === "string" ? a.postalCode : "",
      city: typeof a.city === "string" ? a.city : "",
      defaultBillingAddress: a.defaultBillingAddress === true,
      defaultShippingAddress: a.defaultShippingAddress === true,
    });
  }
  return out;
}

function primaryAddressLine(addresses: CustomerAddress[]): string {
  const hit =
    addresses.find((a) => a.defaultBillingAddress) ??
    addresses.find((a) => a.defaultShippingAddress) ??
    addresses[0];
  if (!hit) return "";
  return [hit.streetLine1, hit.postalCode, hit.city].filter(Boolean).join(", ");
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-[28px] font-bold leading-none tracking-[-0.02em] text-[var(--color-ink)]">{value}</p>
      {hint ? <p className="mt-2 text-[12px] text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  openLabel,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  description: string;
  openLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[3px] border border-[var(--color-divider)] bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-copper)]/40 hover:shadow-[0_12px_32px_-12px_oklch(0.18_0.005_60_/_0.18)]"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-copper)]/10 text-[var(--color-copper)] transition-colors group-hover:bg-[var(--color-copper)] group-hover:text-white">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-[15px] font-bold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[var(--color-muted)]">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-copper)]">
        {openLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function quickActions(lc: Locale) {
  return [
    {
      href: "/konto/ordrer",
      icon: ShoppingBag,
      title: tr(lc, "Bestillinger", "Orders"),
      description: tr(lc, "Se ordrehistorikk og spor leveranser.", "View order history and track deliveries."),
    },
    {
      href: "/konto/profil",
      icon: User,
      title: tr(lc, "Kontodetaljer", "Account details"),
      description: tr(lc, "Oppdater navn, e-post og telefon.", "Update your name, email and phone."),
    },
    {
      href: "/konto/adresser",
      icon: MapPin,
      title: tr(lc, "Adresser", "Addresses"),
      description: tr(lc, "Administrer faktura- og leveringsadresser.", "Manage billing and shipping addresses."),
    },
    {
      href: "/konto/passord",
      icon: KeyRound,
      title: tr(lc, "Passord", "Password"),
      description: tr(lc, "Endre passordet for kontoen din.", "Change your account password."),
    },
  ] as const;
}

export function AccountDashboardPanel() {
  const { customer } = useShopAuth();
  const lc = useActiveLocale();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderPreview[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [addressLine, setAddressLine] = useState("");

  const displayName =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim() ||
    customer?.emailAddress ||
    "";
  const firstName = customer?.firstName?.trim() || displayName.split(" ")[0] || displayName;
  const phoneDisplay = customer?.phoneNumber
    ? parseStoredPhone(customer.phoneNumber).nationalNumber || customer.phoneNumber
    : "";

  const load = useCallback(async () => {
    setLoading(true);
    const [ordersRes, customerRes] = await Promise.all([
      shopGraphql<{
        activeCustomer: { orders: { totalItems: number; items: unknown[] | null } | null } | null;
      }>(GQL_CUSTOMER_ORDER_LIST, { options: { take: 100, skip: 0 } }, lc),
      shopGraphql<{ activeCustomer: unknown }>(GQL_ACTIVE_CUSTOMER_PANEL, undefined, lc),
    ]);

    const orderOuter = errorMessageFromShopResult(ordersRes.networkError, ordersRes.graphqlErrors);
    const items: OrderPreview[] = [];
    if (!orderOuter && ordersRes.data?.activeCustomer?.orders?.items) {
      setOrderCount(ordersRes.data.activeCustomer.orders.totalItems ?? 0);
      for (const raw of ordersRes.data.activeCustomer.orders.items) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const id = typeof o.id === "string" || typeof o.id === "number" ? String(o.id) : "";
        const code = typeof o.code === "string" ? o.code : "";
        const state = typeof o.state === "string" ? o.state : "";
        if (!id || !code) continue;
        items.push({
          id,
          code,
          state,
          orderPlacedAt: typeof o.orderPlacedAt === "string" ? o.orderPlacedAt : null,
          createdAt: typeof o.createdAt === "string" ? o.createdAt : null,
          totalWithTax: o.totalWithTax,
          totalQuantity:
            typeof o.totalQuantity === "number" ? o.totalQuantity : Number(o.totalQuantity) || 0,
        });
      }
    } else {
      setOrderCount(0);
    }
    items.sort((a, b) => {
      const da = new Date(a.orderPlacedAt ?? a.createdAt ?? 0).getTime();
      const db = new Date(b.orderPlacedAt ?? b.createdAt ?? 0).getTime();
      return db - da;
    });
    setOrders(items);

    const customerOuter = errorMessageFromShopResult(customerRes.networkError, customerRes.graphqlErrors);
    if (!customerOuter && customerRes.data?.activeCustomer) {
      const addresses = parseAddresses(customerRes.data.activeCustomer);
      setAddressCount(addresses.length);
      setAddressLine(primaryAddressLine(addresses));
    } else {
      setAddressCount(0);
      setAddressLine("");
    }

    setLoading(false);
  }, [lc]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeOrders = orders.filter((o) => o.state !== "Cancelled").length;
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[3px] border border-[var(--color-divider)] bg-gradient-to-br from-white via-white to-[var(--color-stone)]/90 p-6 sm:p-8 lg:p-10 shadow-[var(--shadow-card)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[var(--color-copper)]/[0.07]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-[var(--color-copper)]/[0.04]"
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-copper)]">
            {tr(lc, "Kontrollpanel", "Dashboard")}
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.03em] text-[var(--color-ink)] sm:text-[32px]">
            {tr(lc, "Hei, ", "Hello, ")}
            {firstName}
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-muted)] sm:text-[15px]">
            {tr(
              lc,
              "Her får du oversikt over bestillinger, adresser og kontoinnstillinger — alt samlet på ett sted.",
              "Here’s an overview of your orders, addresses and account settings — all in one place.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/produkter" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-[13px]">
              {tr(lc, "Fortsett å handle", "Continue shopping")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/konto/ordrer"
              className="inline-flex items-center gap-2 rounded-[3px] border border-[var(--color-divider)] bg-white px-5 py-2.5 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-copper)]/40 hover:bg-[var(--color-stone)]/50"
            >
              {tr(lc, "Se alle bestillinger", "View all orders")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={tr(lc, "Bestillinger", "Orders")}
          value={loading ? "—" : orderCount}
          hint={tr(lc, "Totalt antall ordrer", "Total orders placed")}
        />
        <StatCard
          label={tr(lc, "Aktive ordrer", "Active orders")}
          value={loading ? "—" : activeOrders}
          hint={tr(lc, "Ikke kansellerte", "Not cancelled")}
        />
        <StatCard
          label={tr(lc, "Lagrede adresser", "Saved addresses")}
          value={loading ? "—" : addressCount}
          hint={
            addressLine
              ? addressLine
              : tr(lc, "Ingen adresse lagret ennå", "No address saved yet")
          }
        />
      </section>

      <section>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          {tr(lc, "Hurtigvalg", "Quick actions")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions(lc).map((action) => (
            <QuickActionCard
              key={action.href}
              {...action}
              openLabel={tr(lc, "Åpne", "Open")}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)]">
              {tr(lc, "Nylige bestillinger", "Recent orders")}
            </h2>
            <Link
              href="/konto/ordrer"
              className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-copper)] hover:underline underline-offset-2"
            >
              {tr(lc, "Se alle", "View all")}
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-[14px] text-[var(--color-muted)]">{tr(lc, "Laster …", "Loading …")}</p>
          ) : recentOrders.length === 0 ? (
            <div className="mt-6 rounded-[3px] border border-dashed border-[var(--color-divider)] bg-[var(--color-stone)]/40 px-6 py-10 text-center">
              <Package className="mx-auto h-8 w-8 text-[var(--color-copper)]/70" strokeWidth={1.5} />
              <p className="mt-4 text-[15px] font-medium text-[var(--color-ink)]">
                {tr(lc, "Ingen bestillinger ennå", "No orders yet")}
              </p>
              <p className="mt-2 text-[13px] text-[var(--color-muted)]">
                {tr(lc, "Når du handler hos oss, vises ordrene dine her.", "When you shop with us, your orders will appear here.")}
              </p>
              <Link href="/produkter" className="btn-primary mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-[13px]">
                {tr(lc, "Utforsk produkter", "Browse products")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-[var(--color-divider)]">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/konto/ordrer/${order.id}`}
                    className="group flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-[var(--color-stone)]/30 -mx-2 px-2 rounded-[2px]"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-copper)]">
                        #{order.code}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                        {formatOrderDate(order.orderPlacedAt ?? order.createdAt, lc)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[12px] font-semibold uppercase tracking-[0.06em] ${orderStateTone(order.state)}`}>
                        {orderStateLabel(order.state, lc)}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[var(--color-ink)]">
                        {formatOrderTotalSummary(lc, order.totalWithTax, order.totalQuantity)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">
            {tr(lc, "Kontooversikt", "Account overview")}
          </h2>
          <ul className="mt-5 space-y-4">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-stone)] text-[var(--color-copper)]">
                <User className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                  {tr(lc, "Navn", "Name")}
                </p>
                <p className="mt-1 text-[14px] text-[var(--color-ink)]">{displayName}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-stone)] text-[var(--color-copper)]">
                <Mail className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                  {tr(lc, "E-post", "Email")}
                </p>
                <p className="mt-1 break-all text-[14px] text-[var(--color-ink)]">{customer?.emailAddress}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-stone)] text-[var(--color-copper)]">
                <Phone className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                  {tr(lc, "Telefon", "Phone")}
                </p>
                <p className="mt-1 text-[14px] text-[var(--color-ink)]">
                  {phoneDisplay || tr(lc, "Ikke oppgitt", "Not provided")}
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-stone)] text-[var(--color-copper)]">
                <MapPin className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                  {tr(lc, "Standardadresse", "Default address")}
                </p>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-ink)]">
                  {addressLine || tr(lc, "Ingen adresse lagret", "No address saved")}
                </p>
              </div>
            </li>
          </ul>
          <Link
            href="/konto/profil"
            className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-copper)] hover:underline underline-offset-2"
          >
            {tr(lc, "Rediger profil", "Edit profile")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}
