"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { errorMessageFromShopResult, shopGraphql } from "@/lib/vendure/shop-client-browser";
import {
  GQL_ACTIVE_CUSTOMER_PANEL,
  GQL_CREATE_CUSTOMER_ADDRESS,
  GQL_UPDATE_CUSTOMER,
  GQL_UPDATE_CUSTOMER_PASSWORD,
} from "@/lib/vendure/shop-auth-documents";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { tr } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { AuthFieldGroup } from "@/components/account/AuthFieldGroup";
import { PasswordRequirementsHint } from "@/components/account/PasswordRequirementsHint";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";
import { requiredCurrentPasswordMessage } from "@/lib/auth/auth-messages";
import { isBlankInput } from "@/lib/auth/email-validation";
import { firstFieldError } from "@/lib/auth/field-errors";
import { validatePasswordComplexity } from "@/lib/auth/validate";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";

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
  const { customer, logout } = useShopAuth();
  const router = useRouter();
  const lc = useActiveLocale();
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
  const { refresh, customer } = useShopAuth();
  const lc = useActiveLocale();
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
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
      <h2 className="text-[16px] sm:text-[18px] font-bold text-[var(--color-ink)]">
        {tr(lc, "Kontodetaljer", "Account details")}
      </h2>

      <form onSubmit={(e) => void save(e)} className="mt-6 w-full space-y-4 sm:mt-8">
        <div className={ACCOUNT_FORM_GRID}>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "Fornavn", "First name")} *
            <input
              className={ACCOUNT_FIELD_INPUT}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "Etternavn", "Last name")} *
            <input
              className={ACCOUNT_FIELD_INPUT}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "E-postadresse (brukernavn)", "Email address (username)")}
            <input
              type="email"
              className={`${ACCOUNT_FIELD_INPUT} cursor-not-allowed bg-[var(--color-stone)]/40 text-[var(--color-muted)]`}
              value={customer?.emailAddress ?? ""}
              disabled
              readOnly
            />
            <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-[var(--color-muted)]">
              {tr(
                lc,
                "E-postadressen fungerer som brukernavn og kan ikke endres direkte.",
                "The email address acts as your username and cannot be changed directly.",
              )}
            </span>
          </label>
          <label className={ACCOUNT_FIELD_LABEL}>
            {tr(lc, "Telefonnummer", "Phone number")}
            <PhoneInputWithCountry
              value={phone}
              onChange={setPhone}
              className="mt-1"
            />
          </label>
        </div>
      {/*   <p className="text-[12px] text-[var(--color-muted)]">
          {tr(lc, "Endre adresser under ", "Manage addresses under ")}
          <Link href="/konto/adresser" className="text-[var(--color-copper)] underline-offset-2 hover:underline">
            {tr(lc, "Adresser", "Addresses")}
          </Link>
          .
        </p> */}
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
          <input className={ACCOUNT_FIELD_INPUT} value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Firma (valgfritt)", "Company (optional)")}
          <input className={ACCOUNT_FIELD_INPUT} value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Land / region", "Country / region")} *
          <select className={ACCOUNT_FIELD_INPUT} defaultValue="NO" disabled>
            <option value="NO">{tr(lc, "Norge", "Norway")}</option>
          </select>
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Telefonnummer", "Phone number")}
          <PhoneInputWithCountry value={phone} onChange={setPhone} className="mt-1" />
        </label>
        <label className={`${ACCOUNT_FIELD_LABEL} sm:col-span-2`}>
          {tr(lc, "Gateadresse", "Street address")} *
          <input
            className={ACCOUNT_FIELD_INPUT}
            value={street1}
            onChange={(e) => setStreet1(e.target.value)}
            placeholder={tr(lc, "Gatenavn og nummer", "Street name and number")}
            required
            maxLength={255}
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
            maxLength={255}
          />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Postnummer", "Postal code")} *
          <input className={ACCOUNT_FIELD_INPUT} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required maxLength={20} />
        </label>
        <label className={ACCOUNT_FIELD_LABEL}>
          {tr(lc, "Poststed (by)", "City")} *
          <input className={ACCOUNT_FIELD_INPUT} value={city} onChange={(e) => setCity(e.target.value)} required maxLength={255} />
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
  const { customer } = useShopAuth();
  const lc = useActiveLocale();
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

type PasswordFieldKey = "current" | "next" | "confirm";

export function AccountPasswordPanel() {
  const router = useRouter();
  const { customer } = useShopAuth();
  const lc = useActiveLocale();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PasswordFieldKey, string>>>({});
  const [busy, setBusy] = useState(false);

  const clearFieldError = (field: PasswordFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const pwdErr = validatePasswordComplexity(next, lc);
    const errors = firstFieldError<PasswordFieldKey>([
      { field: "current", message: isBlankInput(current) ? requiredCurrentPasswordMessage(lc) : null },
      { field: "next", message: pwdErr },
      {
        field: "confirm",
        message: next !== confirm ? tr(lc, "Nytt passord stemmer ikke overens.", "New passwords do not match.") : null,
      },
    ]);

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
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
      setFieldErrors({ current: outer });
      return;
    }
    const p = res.data?.updateCustomerPassword && typeof res.data.updateCustomerPassword === "object"
      ? (res.data.updateCustomerPassword as Record<string, unknown>)
      : null;
    const ok = p && typeof p.__typename === "string" ? p.__typename === "Success" : false;
    if (!ok) {
      const m = typeof p?.message === "string" ? p.message : tr(lc, "Kunne ikke bytte passord.", "Could not change password.");
      setFieldErrors({ current: m });
      return;
    }

    const accountEmail = customer?.emailAddress?.trim();
    if (accountEmail) {
      try {
        await fetch("/api/auth/send-password-changed-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: accountEmail, locale: lc }),
        });
      } catch {
        // Password change succeeded; email failure should not block the update.
      }
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    router.replace("/");
  };

  return (
   <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 sm:p-8 lg:p-10">
  <h2 className="text-[16px] sm:text-[18px] font-bold">
    {tr(lc, "Passord", "Password")}
  </h2>

  <form onSubmit={(e) => void submit(e)} className="mt-4 sm:mt-6 w-full space-y-4">
    <div className={ACCOUNT_FORM_GRID}>
      <AuthFieldGroup
        label={tr(lc, "Nåværende passord", "Current password")}
        error={fieldErrors.current}
        labelClassName={ACCOUNT_FIELD_LABEL}
      >
        <PasswordWithToggle
          value={current}
          onChange={(v) => {
            setCurrent(v);
            clearFieldError("current");
          }}
          required
          autoComplete="current-password"
          maxLength={255}
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-3 py-2 sm:px-4 text-sm sm:text-base"
        />
      </AuthFieldGroup>

      <div>
        <AuthFieldGroup
          label={tr(lc, "Nytt passord", "New password")}
          error={fieldErrors.next}
          labelClassName={ACCOUNT_FIELD_LABEL}
        >
          <PasswordWithToggle
            value={next}
            onChange={(v) => {
              setNext(v);
              clearFieldError("next");
            }}
            required
            autoComplete="new-password"
            maxLength={255}
            showLabel={tr(lc, "Vis passord", "Show password")}
            hideLabel={tr(lc, "Skjul passord", "Hide password")}
            className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-3 py-2 sm:px-4 pr-10 text-sm sm:text-base"
          />
        </AuthFieldGroup>
        <PasswordRequirementsHint />
      </div>

      <AuthFieldGroup
        label={tr(lc, "Gjenta nytt passord", "Confirm new password")}
        error={fieldErrors.confirm}
        labelClassName={ACCOUNT_FIELD_LABEL}
      >
        <PasswordWithToggle
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            clearFieldError("confirm");
          }}
          required
          autoComplete="new-password"
          maxLength={255}
          showLabel={tr(lc, "Vis passord", "Show password")}
          hideLabel={tr(lc, "Skjul passord", "Hide password")}
          className="mt-1 w-full rounded-[2px] border border-[var(--color-divider)] px-3 py-2 sm:px-4 pr-10 text-sm sm:text-base"
        />
      </AuthFieldGroup>
    </div>

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

export { AccountOrdersPanel } from "@/components/account/AccountOrdersPanel";
export { AccountOrderDetailPanel } from "@/components/account/AccountOrderDetailPanel";
