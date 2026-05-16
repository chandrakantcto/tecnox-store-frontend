"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { errorMessageFromShopResult, shopGraphql } from "@/lib/vendure/shop-client-browser";
import {
  GQL_CUSTOMER_ORDER_LIST,
  GQL_ORDER_DETAIL,
  GQL_UPDATE_CUSTOMER,
  GQL_UPDATE_CUSTOMER_PASSWORD,
} from "@/lib/vendure/shop-auth-documents";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { tr } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { absoluteAssetUrl } from "@/lib/vendure/normalize";
import { formatMoneyMinorKr } from "@/lib/vendure/money-display";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";

export function AccountDashboardPanel() {
  const { locale, customer } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";
  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
      <p className="text-[14px] text-[var(--color-muted)]">
        {tr(lc, `Hei, ${customer?.firstName || ""}!`, `Hi, ${customer?.firstName || ""}!`)}
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/konto/ordrer" className="rounded-[3px] border border-[var(--color-divider)] p-6 hover:border-[var(--color-copper)]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
            {tr(lc, "Ordrer", "Orders")}
          </p>
          <p className="mt-2 text-[15px] text-[var(--color-ink)]">{tr(lc, "Se historikk og status.", "See history and states.")}</p>
        </Link>
        <Link href="/konto/profil" className="rounded-[3px] border border-[var(--color-divider)] p-6 hover:border-[var(--color-copper)]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
            {tr(lc, "Profil", "Profile")}
          </p>
          <p className="mt-2 text-[15px] text-[var(--color-ink)]">{tr(lc, "Oppdater navn og telefon.", "Update name and phone.")}</p>
        </Link>
      </ul>
    </div>
  );
}

export function AccountProfilePanel() {
  const { locale, refresh, customer } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";
  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [phone, setPhone] = useState(customer?.phoneNumber ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName);
      setLastName(customer.lastName);
      setPhone(customer.phoneNumber ?? "");
    }
  }, [customer]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = await shopGraphql<{ updateCustomer: unknown }>(
      GQL_UPDATE_CUSTOMER,
      {
        input: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phone.trim() || undefined,
        },
      },
      lc,
    );
    setBusy(false);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer) {
      setMsg(outer);
      return;
    }
    await refresh();
    setMsg(tr(lc, "Profil oppdatert.", "Profile updated."));
  };

  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
      <h2 className="text-[18px] font-bold text-[var(--color-ink)]">{tr(lc, "Profil", "Profile")}</h2>
      <p className="mt-1 text-[13px] text-[var(--color-muted)]">{customer?.emailAddress}</p>
      <form onSubmit={(e) => void save(e)} className="mt-8 space-y-4 max-w-md">
        <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {tr(lc, "Fornavn", "First name")}
          <input
            className="mt-1 w-full rounded-[2px] border px-4 py-2 text-[14px]"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {tr(lc, "Etternavn", "Last name")}
          <input
            className="mt-1 w-full rounded-[2px] border px-4 py-2 text-[14px]"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {tr(lc, "Telefon", "Phone")}
          <input
            className="mt-1 w-full rounded-[2px] border px-4 py-2 text-[14px]"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        {msg ? <p className="text-[13px] text-[var(--color-ink)]">{msg}</p> : null}
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {tr(lc, "Lagre", "Save")}
        </button>
      </form>
    </div>
  );
}

export function AccountPasswordPanel() {
  const { locale } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) {
      setMsg(tr(lc, "Nytt passord må være minst 8 tegn.", "New password must be at least 8 characters."));
      return;
    }
    if (next !== confirm) {
      setMsg(tr(lc, "Nytt passord stemmer ikke overens.", "New passwords do not match."));
      return;
    }
    setBusy(true);
    const res = await shopGraphql<{ updateCustomerPassword: unknown }>(
      GQL_UPDATE_CUSTOMER_PASSWORD,
      { currentPassword: current, newPassword: next },
      lc,
    );
    setBusy(false);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer) {
      setMsg(outer);
      return;
    }
    const p = res.data?.updateCustomerPassword && typeof res.data.updateCustomerPassword === "object"
      ? (res.data.updateCustomerPassword as Record<string, unknown>)
      : null;
    const ok = p && typeof p.__typename === "string" ? p.__typename === "Success" : false;
    if (!ok) {
      const m = typeof p?.message === "string" ? p.message : tr(lc, "Kunne ikke bytte passord.", "Could not change password.");
      setMsg(m);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setMsg(tr(lc, "Passord oppdatert.", "Password updated."));
  };

  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-8 max-w-md">
      <h2 className="text-[18px] font-bold">{tr(lc, "Bytt passord", "Change password")}</h2>
      <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
        <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {tr(lc, "Nåværende passord", "Current password")}
          <PasswordWithToggle
            value={current}
            onChange={setCurrent}
            required
            autoComplete="current-password"
            showLabel={tr(lc, "Vis passord", "Show password")}
            hideLabel={tr(lc, "Skjul passord", "Hide password")}
            className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-2 pr-10"
          />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {tr(lc, "Nytt passord", "New password")}
          <PasswordWithToggle
            value={next}
            onChange={setNext}
            required
            autoComplete="new-password"
            showLabel={tr(lc, "Vis passord", "Show password")}
            hideLabel={tr(lc, "Skjul passord", "Hide password")}
            className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-2 pr-10"
          />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {tr(lc, "Gjenta nytt passord", "Confirm new password")}
          <PasswordWithToggle
            value={confirm}
            onChange={setConfirm}
            required
            autoComplete="new-password"
            showLabel={tr(lc, "Vis passord", "Show password")}
            hideLabel={tr(lc, "Skjul passord", "Hide password")}
            className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-4 py-2 pr-10"
          />
        </label>
        {msg ? <p className="text-[13px]">{msg}</p> : null}
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {tr(lc, "Oppdater passord", "Update password")}
        </button>
      </form>
    </div>
  );
}

type OrderRow = {
  id: string;
  code: string;
  state: string;
  orderPlacedAt: string | null;
  currencyCode?: string | null;
  totalWithTax?: unknown;
};

export function AccountOrdersPanel() {
  const { locale } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await shopGraphql<{
      activeCustomer: { orders: { items: unknown[] | null } | null } | null;
    }>(GQL_CUSTOMER_ORDER_LIST, { options: { take: 100, skip: 0 } }, lc);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer || !res.data?.activeCustomer?.orders?.items) {
      setRows([]);
      setLoading(false);
      return;
    }
    const items: OrderRow[] = [];
    for (const raw of res.data.activeCustomer.orders.items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const id = typeof o.id === "string" || typeof o.id === "number" ? String(o.id) : "";
      const code = typeof o.code === "string" ? o.code : "";
      const state = typeof o.state === "string" ? o.state : "";
      if (!id || !code) continue;
      const orderPlacedAt = typeof o.orderPlacedAt === "string" ? o.orderPlacedAt : null;
      items.push({
        id,
        code,
        state,
        orderPlacedAt,
        currencyCode: typeof o.currencyCode === "string" ? o.currencyCode : "",
        totalWithTax: o.totalWithTax,
      });
    }
    setRows(items);
    setLoading(false);
  }, [lc]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
      <h2 className="text-[18px] font-bold">{tr(lc, "Mine ordrer", "My orders")}</h2>
      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--color-muted)]">{tr(lc, "Laster …", "Loading …")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-[14px] text-[var(--color-muted)]">{tr(lc, "Ingen ordrer funnet ennå.", "No orders yet.")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-divider)]">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-mono text-[15px] font-bold">{row.code}</p>
                <p className="text-[13px] text-[var(--color-muted)]">
                  {row.state}
                  {row.orderPlacedAt ? ` · ${new Date(row.orderPlacedAt).toLocaleDateString(lc === "en" ? "en-GB" : "nb-NO")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[14px]">kr {formatMoneyMinorKr(row.totalWithTax)}</span>
                <Link href={`/konto/ordrer/${encodeURIComponent(row.id)}`} className="btn-outline-dark text-[13px]">
                  {tr(lc, "Detaljer", "Details")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AccountOrderDetailPanel() {
  const params = useParams();
  const rawId = params?.orderId;
  const orderId = typeof rawId === "string" ? decodeURIComponent(rawId) : "";

  const { locale } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      const res = await shopGraphql<{ order: unknown }>(GQL_ORDER_DETAIL, { id: orderId }, lc);
      const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
      if (outer || !res.data?.order) {
        setErr(outer ?? tr(lc, "Ordre ikke tilgjengelig.", "Order not available."));
        setData(null);
      } else {
        setErr(null);
        setData(res.data.order);
      }
      setLoading(false);
    })();
  }, [orderId, lc]);

  if (!orderId) return <p>{tr(lc, "Ugyldig ordre.", "Invalid order.")}</p>;
  if (loading) return <p className="text-[var(--color-muted)]">{tr(lc, "Laster …", "Loading …")}</p>;
  if (err || !data || typeof data !== "object") {
    return (
      <p className="text-red-800">
        {err ?? tr(lc, "Fant ikke ordren.", "Order not found.")}
      </p>
    );
  }
  const o = data as Record<string, unknown>;

  return (
    <div className="space-y-8">
      <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
        <p className="font-mono text-[22px] font-bold">{typeof o.code === "string" ? o.code : ""}</p>
        <p className="mt-2 text-[14px] text-[var(--color-muted)]">
          {typeof o.state === "string" ? o.state : ""}{" "}
          {typeof o.orderPlacedAt === "string" ?
            `· ${new Date(o.orderPlacedAt).toLocaleString(lc === "en" ? "en-GB" : "nb-NO")}`
          : null}
        </p>
        <dl className="mt-8 grid gap-3 sm:grid-cols-2 text-[14px]">
          <dt className="text-[var(--color-muted)]">{tr(lc, "Total m/MVA", "Total inc. VAT")}</dt>
          <dd className="font-mono">kr {formatMoneyMinorKr(o.totalWithTax)}</dd>
        </dl>
        <ShippingBlock title={tr(lc, "Leveranse", "Shipping")} addr={o.shippingAddress} />
        <ShippingBlock title={tr(lc, "Faktura", "Billing")} addr={o.billingAddress} />
      </div>
      <LinesBlock lines={o.lines as unknown[]} locale={lc} />
      <Link href="/konto/ordrer" className="inline-block text-[14px] text-[var(--color-copper)] underline-offset-2 hover:underline">
        ← {tr(lc, "Tilbake til ordrer", "Back to orders")}
      </Link>
    </div>
  );
}

function ShippingBlock({ title, addr }: { title: string; addr: unknown }) {
  if (!addr || typeof addr !== "object") return null;
  const a = addr as Record<string, unknown>;
  return (
    <div className="mt-8 border-t border-[var(--color-divider)] pt-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">{title}</p>
      <address className="mt-3 whitespace-pre-line not-italic text-[14px] leading-relaxed">
        {typeof a.fullName === "string" ? `${a.fullName}\n` : null}
        {typeof a.streetLine1 === "string" ? `${a.streetLine1}\n` : null}
        {typeof a.postalCode === "string" || typeof a.city === "string"
          ? `${String(a.postalCode ?? "").trim()} ${String(a.city ?? "").trim()}`.trim() + "\n"
          : null}
        {typeof a.countryCode === "string" ? `${a.countryCode}\n` : null}
        {typeof a.phoneNumber === "string" ? a.phoneNumber : null}
      </address>
    </div>
  );
}

function LinesBlock({ lines, locale }: { lines: unknown[] | undefined | null; locale: Locale }) {
  if (!Array.isArray(lines) || !lines.length) return null;
  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white">
      <h3 className="border-b px-8 py-4 text-[14px] font-bold">{tr(locale, "Linjer", "Lines")}</h3>
      <ul className="divide-y divide-[var(--color-divider)]">
        {lines.map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const line = raw as Record<string, unknown>;
          const pv = line.productVariant && typeof line.productVariant === "object" ? (line.productVariant as Record<string, unknown>) : null;
          const prod =
            pv?.product && typeof pv.product === "object" ? (pv.product as Record<string, unknown>) : null;
          const name =
            typeof prod?.name === "string" ? prod.name
            : typeof pv?.name === "string"
              ? pv.name
              : tr(locale, "Vare", "Item");
          const slug = typeof prod?.slug === "string" ? prod.slug : "";
          const qty = typeof line.quantity === "number" ? line.quantity : 0;
          const preview =
            pv?.featuredAsset && typeof pv.featuredAsset === "object"
              ? String((pv.featuredAsset as Record<string, unknown>).preview ?? "")
              : "";
          const img = preview ? absoluteAssetUrl(preview) : "";
          const lineKr = formatMoneyMinorKr(line.discountedLinePriceWithTax);

          const inner = (
            <div className="flex items-start gap-4 p-5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[2px] bg-[var(--color-stone)]">
                {img ? <Image src={img} alt="" fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{name}</p>
                <p className="text-[13px] text-[var(--color-muted)]">
                  {qty} × kr {formatMoneyMinorKr(line.discountedUnitPriceWithTax)}
                </p>
              </div>
              <p className="font-mono whitespace-nowrap">kr {lineKr}</p>
            </div>
          );

          return (
            <li key={typeof line.id === "string" || typeof line.id === "number" ? String(line.id) : slug + qty}>
              {slug ?
                <Link href={`/produkter/${encodeURIComponent(slug)}`} className="block hover:bg-[var(--color-stone)]">
                  {inner}
                </Link>
              : inner}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
