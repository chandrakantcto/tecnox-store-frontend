"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { errorMessageFromShopResult, shopGraphql } from "@/lib/vendure/shop-client-browser";
import {
  GQL_ACTIVE_CUSTOMER_PANEL,
  GQL_CREATE_CUSTOMER_ADDRESS,
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

type CustomerAddress = {
  id: string;
  fullName: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  postalCode: string;
  phoneNumber: string;
  countryCode: string;
  defaultShippingAddress: boolean;
  defaultBillingAddress: boolean;
};

function parseCustomerAddresses(raw: unknown): CustomerAddress[] {
  if (!raw || typeof raw !== "object") return [];
  const items = (raw as { addresses?: unknown }).addresses;
  if (!Array.isArray(items)) return [];
  const out: CustomerAddress[] = [];
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const a = row as Record<string, unknown>;
    const id = typeof a.id === "string" || typeof a.id === "number" ? String(a.id) : "";
    if (!id) continue;
    const country =
      a.country && typeof a.country === "object"
        ? String((a.country as Record<string, unknown>).code ?? "")
        : "";
    out.push({
      id,
      fullName: typeof a.fullName === "string" ? a.fullName : "",
      streetLine1: typeof a.streetLine1 === "string" ? a.streetLine1 : "",
      streetLine2: typeof a.streetLine2 === "string" ? a.streetLine2 : "",
      city: typeof a.city === "string" ? a.city : "",
      postalCode: typeof a.postalCode === "string" ? a.postalCode : "",
      phoneNumber: typeof a.phoneNumber === "string" ? a.phoneNumber : "",
      countryCode: country,
      defaultShippingAddress: a.defaultShippingAddress === true,
      defaultBillingAddress: a.defaultBillingAddress === true,
    });
  }
  return out;
}

function orderStateLabel(state: string, lc: Locale): string {
  const labels: Record<string, [string, string]> = {
    ArrangingPayment: ["Arrangerer betaling", "Arranging payment"],
    AddingItems: ["Handlekurv", "Cart"],
    PaymentAuthorized: ["Betaling godkjent", "Payment authorized"],
    PaymentSettled: ["Betalt", "Paid"],
    Shipped: ["Sendt", "Shipped"],
    Delivered: ["Levert", "Delivered"],
    Cancelled: ["Kansellert", "Cancelled"],
  };
  const hit = labels[state];
  return hit ? tr(lc, hit[0], hit[1]) : state;
}

function orderStateTone(state: string): string {
  if (state === "ArrangingPayment" || state === "AddingItems") {
    return "text-amber-700";
  }
  if (state === "PaymentSettled" || state === "Delivered" || state === "Shipped") {
    return "text-emerald-700";
  }
  if (state === "Cancelled") return "text-red-700";
  return "text-[var(--color-muted)]";
}

function formatOrderTotalSummary(lc: Locale, totalWithTax: unknown, totalQuantity: number): string {
  const kr = formatMoneyMinorKr(totalWithTax).replace(/,-$/, "");
  const count = totalQuantity > 0 ? totalQuantity : 1;
  const word =
    count === 1 ? tr(lc, "produkt", "product") : tr(lc, "produkter", "products");
  return `kr ${kr} ${tr(lc, "for", "for")} ${count} ${word}`;
}

const ACCOUNT_FORM_GRID = "grid w-full gap-4 sm:grid-cols-2";
const ACCOUNT_FIELD_LABEL =
  "block text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]";
const ACCOUNT_FIELD_INPUT =
  "mt-1 w-full rounded-[2px] border px-3 sm:px-4 py-2 text-[13px] sm:text-[14px]";

function primaryAddressLine(addresses: CustomerAddress[]): string {
  const hit =
    addresses.find((a) => a.defaultBillingAddress) ??
    addresses.find((a) => a.defaultShippingAddress) ??
    addresses[0];
  if (!hit) return "";
  return [hit.streetLine1, hit.postalCode, hit.city].filter(Boolean).join(", ");
}

function pickAddressByKind(addresses: CustomerAddress[], kind: "billing" | "shipping"): CustomerAddress | null {
  if (kind === "billing") {
    return addresses.find((a) => a.defaultBillingAddress) ?? null;
  }
  return addresses.find((a) => a.defaultShippingAddress) ?? null;
}

function formatAddressBlock(addr: CustomerAddress): string {
  return [
    addr.fullName,
    addr.streetLine1,
    addr.streetLine2,
    [addr.postalCode, addr.city].filter(Boolean).join(" "),
    addr.countryCode,
    addr.phoneNumber,
  ]
    .filter(Boolean)
    .join("\n");
}

export function AccountDashboardPanel() {
  const { locale, customer, logout } = useShopAuth();
  const router = useRouter();
  const lc: Locale = locale === "en" ? "en" : "nb";
  const displayName =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim() ||
    customer?.emailAddress ||
    "";

  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
      <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
        {tr(lc, "Hei ", "Hello ")}
        <span className="font-semibold text-[var(--color-copper)]">{displayName}</span>{" "}
        <button
          type="button"
          onClick={() => void logout().then(() => router.push("/"))}
          className="text-[var(--color-copper)] underline-offset-2 hover:underline"
        >
          ({tr(lc, "Logg ut", "Log out")})
        </button>
      </p>
      <p className="mt-5 text-[15px] leading-[1.75] text-[var(--color-ink)]">
        {tr(
          lc,
          "Fra kontrollpanelet kan du se ",
          "From your dashboard you can view ",
        )}
        <Link href="/konto/ordrer" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
          {tr(lc, "nylige bestillinger", "recent orders")}
        </Link>
        {tr(lc, ", administrere ", ", manage ")}
        <Link href="/konto/profil" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
          {tr(lc, "kontodetaljer", "account details")}
        </Link>
        {tr(lc, ", ", ", ")}
        <Link href="/konto/adresser" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
          {tr(lc, "adresser", "addresses")}
        </Link>
        {tr(lc, " og endre ", " and change your ")}
        <Link href="/konto/passord" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
          {tr(lc, "passord", "password")}
        </Link>
        .
      </p>
    </div>
  );
}

export function AccountProfilePanel() {
  const { locale, refresh, customer } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";
  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [phone, setPhone] = useState(customer?.phoneNumber ?? "");
  const [addressLine, setAddressLine] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName);
      setLastName(customer.lastName);
      setPhone(customer.phoneNumber ?? "");
    }
  }, [customer]);

  useEffect(() => {
    void (async () => {
      const res = await shopGraphql<{ activeCustomer: unknown }>(GQL_ACTIVE_CUSTOMER_PANEL, undefined, lc);
      if (res.data?.activeCustomer) {
        setAddressLine(primaryAddressLine(parseCustomerAddresses(res.data.activeCustomer)));
      }
    })();
  }, [lc]);

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
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
      <h2 className="text-[16px] sm:text-[18px] font-bold text-[var(--color-ink)]">
        {tr(lc, "Kontodetaljer", "Account details")}
      </h2>
      <p className="mt-1 text-[12px] sm:text-[13px] text-[var(--color-muted)]">
        {customer?.emailAddress}
      </p>
      <p className="mt-2 text-[12px] text-[var(--color-muted)]">
        {tr(
          lc,
          "E-postadressen fungerer som brukernavn og kan ikke endres direkte.",
          "Your email address is your username and cannot be changed directly.",
        )}
      </p>

      <form onSubmit={(e) => void save(e)} className="mt-6 w-full space-y-4 sm:mt-8">
        <div className={ACCOUNT_FORM_GRID}>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "Fornavn", "First name")}
            <input
              className={ACCOUNT_FIELD_INPUT}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "Etternavn", "Last name")}
            <input
              className={ACCOUNT_FIELD_INPUT}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "Telefon", "Phone")}
            <input
              className={ACCOUNT_FIELD_INPUT}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "Adresse", "Address")}
            <input
              className={`${ACCOUNT_FIELD_INPUT} bg-[var(--color-stone)]/40`}
              value={addressLine}
              readOnly
              placeholder={tr(lc, "Ingen adresse lagret", "No address saved")}
            />
          </label>
        </div>
        <p className="text-[12px] text-[var(--color-muted)]">
          {tr(lc, "Endre adresser under ", "Manage addresses under ")}
          <Link href="/konto/adresser" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
            {tr(lc, "Adresser", "Addresses")}
          </Link>
          .
        </p>
        {msg ? <p className="text-[12px] sm:text-[13px] text-[var(--color-ink)]">{msg}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full sm:w-auto px-6 py-2.5 rounded-[3px] text-sm font-medium btn-primary disabled:opacity-60"
        >
          {tr(lc, "Lagre endringer", "Save changes")}
        </button>
      </form>
    </div>
  );
}

type AddressKind = "billing" | "shipping";

function AccountAddressEditForm({
  kind,
  locale,
  customer,
  onCancel,
  onSaved,
}: {
  kind: AddressKind;
  locale: Locale;
  customer: { firstName: string; lastName: string; phoneNumber: string | null } | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const lc = locale;
  const [fullName, setFullName] = useState(
    customer ? [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() : "",
  );
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState(customer?.phoneNumber ?? "");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title =
    kind === "billing"
      ? tr(lc, "Rediger fakturaadresse", "Edit billing address")
      : tr(lc, "Rediger leveringsadresse", "Edit shipping address");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = await shopGraphql<{ createCustomerAddress: unknown }>(
      GQL_CREATE_CUSTOMER_ADDRESS,
      {
        input: {
          fullName: fullName.trim(),
          company: company.trim() || undefined,
          streetLine1: street1.trim(),
          streetLine2: street2.trim() || undefined,
          city: city.trim(),
          postalCode: postalCode.trim(),
          countryCode: "NO",
          phoneNumber: phone.trim() || undefined,
          defaultBillingAddress: kind === "billing",
          defaultShippingAddress: kind === "shipping",
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
    onSaved();
  };

  return (
    <form onSubmit={(e) => void save(e)} className="mt-8 w-full space-y-4 border-t border-[var(--color-divider)] pt-8">
      <h3 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]">{title}</h3>
      <div className={ACCOUNT_FORM_GRID}>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Fullt navn", "Full name")} *
          <input className={ACCOUNT_FIELD_INPUT} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Firma (valgfritt)", "Company (optional)")}
          <input className={ACCOUNT_FIELD_INPUT} value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Land / region", "Country / region")} *
          <select className={ACCOUNT_FIELD_INPUT} defaultValue="NO" disabled>
            <option value="NO">{tr(lc, "Norge", "Norway")}</option>
          </select>
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Telefonnummer", "Phone number")}
          <input className={ACCOUNT_FIELD_INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className={`${ACCOUNT_FIELD_LABEL} sm:col-span-2`}>
          {tr(lc, "Gateadresse", "Street address")} *
          <input
            className={ACCOUNT_FIELD_INPUT}
            value={street1}
            onChange={(e) => setStreet1(e.target.value)}
            placeholder={tr(lc, "Gatenavn og nummer", "Street name and number")}
            required
          />
        </label>
        <label className={`${ACCOUNT_FIELD_LABEL} sm:col-span-2`}>
          <span className="sr-only">{tr(lc, "Adresselinje 2", "Address line 2")}</span>
          <input
            className={ACCOUNT_FIELD_INPUT}
            value={street2}
            onChange={(e) => setStreet2(e.target.value)}
            placeholder={tr(
              lc,
              "Leilighet, suite, enhet, etc. (valgfritt)",
              "Apartment, suite, unit, etc. (optional)",
            )}
          />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Postnummer", "Postal code")} *
          <input className={ACCOUNT_FIELD_INPUT} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Poststed (by)", "City")} *
          <input className={ACCOUNT_FIELD_INPUT} value={city} onChange={(e) => setCity(e.target.value)} required />
        </label>
      </div>
      {msg ? <p className="text-[12px] sm:text-[13px] text-[var(--color-ink)]">{msg}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-[3px] text-sm font-medium btn-primary disabled:opacity-60">
          {tr(lc, "Lagre adresse", "Save address")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-[3px] border border-[var(--color-divider)] text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-copper)]"
        >
          {tr(lc, "Avbryt", "Cancel")}
        </button>
      </div>
    </form>
  );
}

export function AccountAddressesPanel() {
  const { locale, customer } = useShopAuth();
  const lc: Locale = locale === "en" ? "en" : "nb";
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AddressKind | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    const res = await shopGraphql<{ activeCustomer: unknown }>(GQL_ACTIVE_CUSTOMER_PANEL, undefined, lc);
    const outer = errorMessageFromShopResult(res.networkError, res.graphqlErrors);
    if (outer || !res.data?.activeCustomer) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setAddresses(parseCustomerAddresses(res.data.activeCustomer));
    setLoading(false);
  }, [lc]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const billing = pickAddressByKind(addresses, "billing");
  const shipping = pickAddressByKind(addresses, "shipping");

  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
      <p className="text-[14px] text-[var(--color-muted)]">
        {tr(
          lc,
          "Følgende adresser vil bli brukt som standard ved utsjekking.",
          "The following addresses will be used as default at checkout.",
        )}
      </p>

      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--color-muted)]">{tr(lc, "Laster adresser …", "Loading addresses …")}</p>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]">
              {tr(lc, "Fakturaadresse", "Billing address")}
            </h3>
            {billing ? (
              <address className="mt-3 whitespace-pre-line not-italic text-[14px] leading-relaxed text-[var(--color-muted)]">
                {formatAddressBlock(billing)}
              </address>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing("billing")}
                  className="mt-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-copper)] underline-offset-2 hover:underline"
                >
                  {tr(lc, "Legg til", "Add")}
                </button>
                <p className="mt-2 text-[14px] text-[var(--color-muted)]">
                  {tr(lc, "Du har ikke angitt denne adressetypen ennå.", "You have not set this address type yet.")}
                </p>
              </>
            )}
          </div>
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]">
              {tr(lc, "Leveringsadresse", "Shipping address")}
            </h3>
            {shipping ? (
              <address className="mt-3 whitespace-pre-line not-italic text-[14px] leading-relaxed text-[var(--color-muted)]">
                {formatAddressBlock(shipping)}
              </address>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing("shipping")}
                  className="mt-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-copper)] underline-offset-2 hover:underline"
                >
                  {tr(lc, "Legg til", "Add")}
                </button>
                <p className="mt-2 text-[14px] text-[var(--color-muted)]">
                  {tr(lc, "Du har ikke angitt denne adressetypen ennå.", "You have not set this address type yet.")}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {editing ? (
        <AccountAddressEditForm
          kind={editing}
          locale={lc}
          customer={customer}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void loadAddresses();
          }}
        />
      ) : null}
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
   <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
  <h2 className="text-[16px] sm:text-[18px] font-bold">
    {tr(lc, "Passord", "Password")}
  </h2>

  <form onSubmit={(e) => void submit(e)} className="mt-4 sm:mt-6 w-full space-y-4">
    <div className={ACCOUNT_FORM_GRID}>
      <label className={ACCOUNT_FIELD_LABEL}>
        {tr(lc, "Nåværende passord", "Current password")}
        <PasswordWithToggle
          value={current}
          onChange={setCurrent}
          required
          autoComplete="current-password"
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-3 py-2 sm:px-4 text-sm sm:text-base"
        />
      </label>
     

      <label className={ACCOUNT_FIELD_LABEL}>
        {tr(lc, "Nytt passord", "New password")}
        <PasswordWithToggle
          value={next}
          onChange={setNext}
          required
          autoComplete="new-password"
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-3 py-2 sm:px-4 pr-10 text-sm sm:text-base"
        />
      </label>

      <label className={ACCOUNT_FIELD_LABEL}>
        {tr(lc, "Gjenta nytt passord", "Confirm new password")}
        <PasswordWithToggle
          value={confirm}
          onChange={setConfirm}
          required
          autoComplete="new-password"
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-3 py-2 sm:px-4 pr-10 text-sm sm:text-base"
        />
      </label>
    </div>

    {msg ? (
      <p className="text-[12px] sm:text-[13px]">{msg}</p>
    ) : null}

    <button
      type="submit"
      disabled={busy}
      className="w-full sm:w-auto px-6 py-2.5 rounded-[3px] text-sm sm:text-base font-medium btn-primary disabled:opacity-60"
    >
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
  totalQuantity: number;
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
        totalQuantity:
          typeof o.totalQuantity === "number"
            ? o.totalQuantity
            : Number(o.totalQuantity) || 0,
      });
    }
    setRows(items);
    setLoading(false);
  }, [lc]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
      <h2 className="text-[18px] font-bold">{tr(lc, "Bestillinger", "Orders")}</h2>
      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--color-muted)]">{tr(lc, "Laster …", "Loading …")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-[14px] text-[var(--color-muted)]">{tr(lc, "Ingen ordrer funnet ennå.", "No orders yet.")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-divider)] bg-[var(--color-stone)]/50">
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Ordrenummer", "Order number")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Dato", "Date")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Status", "Status")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Total", "Total")}
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-copper)]">
                  {tr(lc, "Handlinger", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-divider)] last:border-b-0">
                  <td className="px-3 py-4 font-mono text-[14px] font-bold text-[var(--color-ink)]">
                    #{row.code}
                  </td>
                  <td className="px-3 py-4 text-[14px] text-[var(--color-muted)]">
                    {row.orderPlacedAt
                      ? new Date(row.orderPlacedAt).toLocaleDateString(lc === "en" ? "en-GB" : "nb-NO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className={`px-3 py-4 text-[14px] font-medium ${orderStateTone(row.state)}`}>
                    {orderStateLabel(row.state, lc)}
                  </td>
                  <td className="px-3 py-4 text-[14px] text-[var(--color-muted)]">
                    {formatOrderTotalSummary(lc, row.totalWithTax, row.totalQuantity)}
                  </td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/konto/ordrer/${encodeURIComponent(row.id)}`}
                      className="inline-flex rounded-[3px] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] btn-primary"
                    >
                      {tr(lc, "Vis", "View")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
