"use client";

import { StorefrontRemoteImage } from "@/components/site/StorefrontRemoteImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/site/TopBar";
import { MainNav } from "@/components/site/MainNav";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { formatNOK, useCart } from "@/contexts/CartContext";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { Locale } from "@/lib/locale";
import { tr } from "@/lib/locale";
import { displayBrandName } from "@/lib/brand";
import { checkoutFormHasErrors, validateCheckoutForm, type CheckoutFormValues } from "@/lib/checkout/validate";
import { CHECKOUT_COUNTRIES, labelForCheckoutCountry } from "@/lib/checkout/countries";
import { sendCheckoutEmails } from "@/lib/checkout/send-checkout-emails";
import { runVendureGuestCheckout } from "@/lib/checkout/vendure-guest-checkout";
import { loginOrRegisterAfterCheckout } from "@/lib/auth/shop-session-auth";
import { useShopAuth } from "@/contexts/ShopAuthContext";
import { Check, ShieldCheck, Truck, Phone } from "lucide-react";
import heroImg from "@/assets/hero-combi.jpg";
import { PasswordWithToggle } from "@/components/ui/PasswordWithToggle";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";

const emptyForm: CheckoutFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  orgNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "NO",
  consent: false,
  password: "",
  confirmPassword: "",
};

export function KasseView({
  megaMenuByLocale,
  locale: _locale,
}: {
  megaMenuByLocale?: MegaMenuLocales;
  locale?: Locale;
}) {
  const locale = useActiveLocale();
  const router = useRouter();
  const { refresh: refreshAuth, customer, initializing: authInitializing } = useShopAuth();
  const isLoggedIn = Boolean(customer);
  const contactPrefilledRef = useRef(false);
  useEffect(() => {
    if (!customer) contactPrefilledRef.current = false;
  }, [customer]);
  const {
    lines,
    subtotal,
    itemCount,
    loading,
    bootstrapError,
    refresh,
    lastActionError,
    clearLastActionError,
    clearCartOptimistic,
  } = useCart();
  const [form, setForm] = useState<CheckoutFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [placedOrderCode, setPlacedOrderCode] = useState<string>("");
  const [placedPaymentSkipped, setPlacedPaymentSkipped] = useState(false);
  const [placedRecipient, setPlacedRecipient] = useState("");
  const [placedEmail, setPlacedEmail] = useState("");
  const [placedAddress, setPlacedAddress] = useState("");
  const [placedTotalKr, setPlacedTotalKr] = useState(0);
  const [postAuthBusy, setPostAuthBusy] = useState(false);
  const [postAuthError, setPostAuthError] = useState<string | null>(null);

  const pwdToggle = {
    show: tr(locale, "Vis passord", "Show password"),
    hide: tr(locale, "Skjul passord", "Hide password"),
  };

  useEffect(() => {
    if (authInitializing || !customer || contactPrefilledRef.current) return;
    setForm((prev) => {
      if (prev.email.trim() !== "") {
        contactPrefilledRef.current = true;
        return prev;
      }
      contactPrefilledRef.current = true;
      return {
        ...prev,
        firstName: customer.firstName || prev.firstName,
        lastName: customer.lastName || prev.lastName,
        email: customer.emailAddress,
        phone: customer.phoneNumber ?? prev.phone,
      };
    });
  }, [authInitializing, customer]);

  const update = (patch: Partial<CheckoutFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmitError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    clearLastActionError();
    const errs = validateCheckoutForm(form, { skipPassword: isLoggedIn, locale });
    setFieldErrors(errs as Record<string, string>);
    if (checkoutFormHasErrors(errs)) return;

    setSubmitting(true);
    try {
      const orderLinesSnapshot = [...lines];
      let checkoutAuthMode: "login" | "signup" = "login";
      let accountCreated = false;
      let skipSetCustomer = isLoggedIn;

      if (!isLoggedIn) {
        setPostAuthBusy(true);
        const auth = await loginOrRegisterAfterCheckout(
          {
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phoneNumber: form.phone,
          },
          locale === "en" ? "en" : "nb",
        );
        setPostAuthBusy(false);
        if (!auth.ok) {
          setSubmitError(auth.error);
          setSubmitting(false);
          return;
        }
        checkoutAuthMode = auth.authMode;
        accountCreated = auth.accountCreated;
        skipSetCustomer = true;
        await refreshAuth();
      } else {
        await refreshAuth();
      }

      const result = await runVendureGuestCheckout(form, {
        locale: locale === "en" ? "en" : "nb",
        skipSetCustomer,
      });
      if (!result.ok) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }

      const checkoutEmailPayload = {
        locale: locale === "en" ? "en" : "nb",
        form: { ...form },
        orderCode: result.orderCode,
        lines: orderLinesSnapshot,
        subtotalKr: Math.round(subtotal),
      };

      const recipientName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      const countryEntry = CHECKOUT_COUNTRIES.find((c) => c.code === form.countryCode.trim().toUpperCase());
      const countryLabel = countryEntry
        ? labelForCheckoutCountry(locale, countryEntry.nb, countryEntry.en)
        : form.countryCode.trim().toUpperCase();
      const addressLine = [
        form.addressLine1.trim(),
        [form.postalCode.trim(), form.city.trim()].filter(Boolean).join(" "),
        countryLabel,
      ]
        .filter(Boolean)
        .join(", ");

      await sendCheckoutEmails({
        ...checkoutEmailPayload,
        authMode: checkoutAuthMode,
        accountCreated,
      });

      clearCartOptimistic();
      await refresh();
      setSubmitting(false);

      setPlacedOrderCode(result.orderCode);
      setPlacedPaymentSkipped(Boolean(result.paymentSkipped));
      setPlacedRecipient(recipientName);
      setPlacedEmail(form.email.trim().toLowerCase());
      setPlacedAddress(addressLine);
      setPlacedTotalKr(Math.round(subtotal));
      setPostAuthError(null);
      setConfirmed(true);
    } catch {
      setSubmitError(tr(locale, "Uventet feil — prøv igjen.", "Unexpected error — please try again."));
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <main className=" bg-[var(--color-stone)]">
        <header className="sticky top-0 z-50">
          <TopBar />
          <MainNav megaMenuByLocale={megaMenuByLocale} />
        </header>
        <PageHero
          label={tr(locale, "Ordre bekreftet", "Order confirmed")}
          title={<>{tr(locale, "Bestilling registrert!", "Order placed!")}</>}
          crumbs={[
            { label: tr(locale, "Handlekurv", "Cart"), to: "/handlekurv" },
            { label: tr(locale, "Kvittering", "Receipt") },
          ]}
          bgImage={heroImg}
          locale={locale}
        />
        <section className="container-x py-16 lg:py-24">
          <Reveal>
            <div className="mx-auto max-w-xl text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h2 className="display-h3 mt-6 text-[var(--color-ink)]">
                {tr(locale, "Takk for bestillingen!", "Thank you for your order!")}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.65] text-[var(--color-muted)]">
                {placedPaymentSkipped
                  ? tr(
                      locale,
                      "Ordren er registrert med valgt offline/manuell betalingsflyt.",
                      "The order has been placed with the selected offline/manual payment flow.",
                    )
                  : tr(
                      locale,
                      "Ordren er registrert i Vendure.",
                      "The order has been created in Vendure.",
                    )}{" "}
                {placedEmail ? (
                  <>
                    {tr(locale, "Ordrebekreftelse er sendt til", "An order confirmation has been sent to")}{" "}
                    <span className="font-semibold text-[var(--color-ink)]">{placedEmail}</span>.
                  </>
                ) : null}
              </p>

              <div className="mx-auto mt-8 max-w-md rounded-[3px] border border-[var(--color-divider)] bg-[var(--color-stone)]/40 px-5 py-5 text-left text-[14px]">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      {tr(locale, "Ordrenummer", "Order reference")}
                    </dt>
                    <dd className="mt-1 font-mono text-[15px] font-bold text-[var(--color-ink)]">{placedOrderCode}</dd>
                  </div>
                  {placedRecipient ? (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                        {tr(locale, "Mottaker", "Recipient")}
                      </dt>
                      <dd className="mt-1 text-[var(--color-ink)]">{placedRecipient}</dd>
                    </div>
                  ) : null}
                  {placedAddress ? (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                        {tr(locale, "Adresse", "Address")}
                      </dt>
                      <dd className="mt-1 text-[var(--color-ink)]">{placedAddress}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      {tr(locale, "Totalbeløp (inkl. MVA)", "Total amount (incl. VAT)")}
                    </dt>
                    <dd className="mt-1 font-mono text-[18px] font-bold text-[var(--color-copper)]">
                      kr {formatNOK(placedTotalKr)}
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="mt-6 text-[13px] text-[var(--color-muted)]">
                {tr(
                  locale,
                  "Vi behandler ordren din så snart som mulig og tar kontakt ved behov.",
                  "Our team will process your order promptly and contact you if needed.",
                )}
              </p>

              {postAuthBusy ? (
                <p className="mt-4 text-[14px] text-[var(--color-muted)]">
                  {tr(
                    locale,
                    "Kobler ordren til kontoen din (innlogging/registrering) …",
                    "Linking your order to your account (sign-in / registration) …",
                  )}
                </p>
              ) : null}
              {postAuthError ? (
                <div className="mx-auto mt-6 max-w-md rounded-[3px] border border-amber-800/30 bg-amber-50 px-4 py-3 text-left text-[14px] text-amber-950">
                  <p className="font-semibold">
                    {tr(
                      locale,
                      "Bestillingen er lagret, men automatisk innlogging feilet.",
                      "Your order is saved, but automatic sign-in failed.",
                    )}
                  </p>
                  <p className="mt-2">{postAuthError}</p>
                  <Link
                    className="mt-3 inline-block font-medium text-[var(--color-copper)] underline-offset-2 hover:underline"
                    href="/logg-inn"
                  >
                    {tr(locale, "Logg inn manuelt", "Sign in manually")}
                  </Link>
                </div>
              ) : null}

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => router.push("/produkter")} className="btn-primary">
                  {tr(locale, "Fortsett å handle", "Continue shopping")}
                </button>
                <Link href="/konto/ordrer" className="btn-outline-dark">
                  {tr(locale, "Se ordrehistorikk", "View order history")}
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
        <Footer locale={locale} />
      </main>
    );
  }

  return (
    <main className=" bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav megaMenuByLocale={megaMenuByLocale} />
      </header>

      <PageHero
        label={tr(locale, "Kasse", "Checkout")}
        title={<>{tr(locale, "Fullfør bestillingen", "Complete your order")}</>}
        description={tr(locale, "Fyll inn dine opplysninger — ordren sendes gjennom Vendure.", "Fill in your details — the order flows through Vendure.")}
        crumbs={[
          { label: tr(locale, "Handlekurv", "Cart"), to: "/handlekurv" },
          { label: tr(locale, "Kasse", "Checkout") },
        ]}
        bgImage={heroImg}
        locale={locale}
      />

      <section className="section-pad bg-[var(--color-stone)] pt-12 lg:pt-16">
        <div className="container-x">
          {bootstrapError ? (
            <div className="mb-8 rounded-[3px] border border-red-700/35 bg-white px-4 py-3 text-[14px] text-red-800">
              {tr(locale, "Kunne ikke laste handlekurv:", "Cannot load cart:")} {bootstrapError}
            </div>
          ) : null}

          {lastActionError ? (
            <button
              type="button"
              className="mb-6 w-full rounded-[3px] border px-4 py-3 text-left text-[14px]"
              onClick={() => clearLastActionError()}
            >
              {lastActionError}
            </button>
          ) : null}

          {loading ? (
            <p className="py-20 text-center text-[var(--color-muted)]">{tr(locale, "Laster…", "Loading…")}</p>
          ) : lines.length === 0 ? (
            <Reveal>
              <div className="mx-auto max-w-xl py-16 text-center">
                <h2 className="display-h3 text-[var(--color-ink)]">{tr(locale, "Handlekurven er tom.", "Your cart is empty.")}</h2>
                <p className="mt-4 text-[15px] text-[var(--color-muted)]">
                  {tr(locale, "Legg til produkter før du fortsetter til kassen.", "Add products before you continue to checkout.")}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/produkter" className="btn-primary">
                    {tr(locale, "Se produkter", "Browse products")}
                  </Link>
                  <button type="button" onClick={() => router.push("/handlekurv")} className="btn-outline-dark">
                    Handlekurv
                  </button>
                </div>
              </div>
            </Reveal>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
              <Reveal>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <Section title={tr(locale, "Kontaktinformasjon", "Contact info")} step="01">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label={tr(locale, "Fornavn", "First name")}
                        required
                        value={form.firstName}
                        onChange={(v) => update({ firstName: v })}
                        error={fieldErrors.firstName}
                        disabled={submitting}
                        maxLength={100}
                      />
                      <FieldInput
                        label={tr(locale, "Etternavn", "Last name")}
                        required
                        value={form.lastName}
                        onChange={(v) => update({ lastName: v })}
                        error={fieldErrors.lastName}
                        disabled={submitting}
                        maxLength={100}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label={tr(locale, "E-post", "Email")}
                        required
                        type="email"
                        value={form.email}
                        onChange={(v) => update({ email: v })}
                        error={fieldErrors.email}
                        disabled={submitting || isLoggedIn}
                        maxLength={255}
                      />
                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          {tr(locale, "Telefon", "Phone")} *
                        </label>
                        <PhoneInputWithCountry
                          value={form.phone}
                          onChange={(v) => update({ phone: v })}
                          disabled={submitting}
                          required
                          hasError={Boolean(fieldErrors.phone)}
                        />
                        {fieldErrors.phone ? (
                          <p className="mt-2 text-[12px] text-red-700">{fieldErrors.phone}</p>
                        ) : null}
                      </div>
                    </div>
                  </Section>

                  {!isLoggedIn ? (
                    <Section title={tr(locale, "Konto for nettbutikk", "Storefront account")} step="02">
                      <p className="text-[13px] text-[var(--color-muted)]">
                        {tr(
                          locale,
                          "Du blir logget inn eller får opprettet konto med denne e-posten etter bestilling. Har du konto fra før, bruk riktig passord.",
                          "After checkout you will be signed in or registered with this email. If you already have an account, use your correct password.",
                        )}
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldInput
                          label={tr(locale, "Passord", "Password")}
                          required
                          type="password"
                          passwordToggle={pwdToggle}
                          value={form.password}
                          onChange={(v) => update({ password: v })}
                          error={fieldErrors.password}
                          disabled={submitting}
                          maxLength={255}
                        />
                        <FieldInput
                          label={tr(locale, "Gjenta passord", "Confirm password")}
                          required
                          type="password"
                          passwordToggle={pwdToggle}
                          value={form.confirmPassword}
                          onChange={(v) => update({ confirmPassword: v })}
                          error={fieldErrors.confirmPassword}
                          disabled={submitting}
                          maxLength={255}
                        />
                      </div>
                    </Section>
                  ) : null}

                  <Section
                    title={tr(locale, "Bedrift og leveranse", "Company & shipping")}
                    step={isLoggedIn ? "02" : "03"}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label={tr(locale, "Bedrift", "Company")}
                        value={form.company}
                        onChange={(v) => update({ company: v })}
                        disabled={submitting}
                        maxLength={100}
                      />
                      <FieldInput
                        label={tr(locale, "Organisasjonsnummer (org.nr.)", "Organization number (Org. No.)")}
                        value={form.orgNumber}
                        onChange={(v) => update({ orgNumber: v })}
                        disabled={submitting}
                        maxLength={100}
                      />
                    </div>
                    <FieldInput
                      label={tr(locale, "Adresselinje 1", "Address line 1")}
                      required
                      value={form.addressLine1}
                      onChange={(v) => update({ addressLine1: v })}
                      error={fieldErrors.addressLine1}
                      disabled={submitting}
                      maxLength={255}
                    />
                    <FieldInput
                      label={tr(locale, "Adresselinje 2 (valgfritt)", "Address line 2 (optional)")}
                      value={form.addressLine2}
                      onChange={(v) => update({ addressLine2: v })}
                      error={fieldErrors.addressLine2}
                      disabled={submitting}
                      maxLength={255}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label={tr(locale, "Poststed", "City")}
                        required
                        value={form.city}
                        onChange={(v) => update({ city: v })}
                        error={fieldErrors.city}
                        disabled={submitting}
                        maxLength={255}
                      />
                      <FieldInput
                        label={tr(locale, "Delstat / fylke", "State / province")}
                        required
                        value={form.state}
                        onChange={(v) => update({ state: v })}
                        error={fieldErrors.state}
                        disabled={submitting}
                        maxLength={255}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label={tr(locale, "Postnummer / PIN", "PIN code / ZIP code")}
                        required
                        value={form.postalCode}
                        onChange={(v) => update({ postalCode: v })}
                        error={fieldErrors.postalCode}
                        disabled={submitting}
                        maxLength={20}
                      />
                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          {tr(locale, "Land", "Country")} *
                        </label>
                        <select
                          className={`w-full rounded-[2px] border bg-white px-4 py-3 text-[14px] transition-colors focus:outline-none ${
                            fieldErrors.countryCode ? "border-red-600 focus:border-red-700" : "border-[var(--color-divider)] focus:border-[var(--color-copper)]"
                          } disabled:opacity-60`}
                          value={form.countryCode}
                          onChange={(e) => update({ countryCode: e.target.value })}
                          disabled={submitting}
                          required
                        >
                          {CHECKOUT_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {labelForCheckoutCountry(locale, c.nb, c.en)}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.countryCode ? <p className="mt-2 text-[12px] text-red-700">{fieldErrors.countryCode}</p> : null}
                      </div>
                    </div>
                    <label className="flex items-start gap-3 text-[13px] leading-[1.55] text-[var(--color-muted)]">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => update({ consent: e.target.checked })}
                        disabled={submitting}
                        className="mt-0.5 h-4 w-4 accent-[var(--color-copper)]"
                      />
                      <span className="cursor-pointer">
                        {tr(
                          locale,
                          "Jeg godkjenner at opplysningene brukes til å behandle og fakturere denne ordren gjennom Tecno X.",
                          "I agree my details may be used to process and fulfil this order through Tecno X.",
                        )}
                      </span>
                    </label>
                    {fieldErrors.consent ? <p className="text-[12px] text-red-700">{fieldErrors.consent}</p> : null}
                  </Section>

                  {submitError ? <p className="rounded-[3px] border border-red-600/35 bg-white px-4 py-3 text-[14px] text-red-900">{submitError}</p> : null}

                  <button
                    type="submit"
                    disabled={submitting || authInitializing}
                    className="btn-primary w-full sm:w-auto disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? tr(locale, "Sender bestilling …", "Placing order …") : authInitializing ? tr(locale, "Laster …", "Loading …") : tr(locale, "Fullfør bestilling", "Complete order")}
                  </button>

                  <p className="text-[12px] text-[var(--color-muted)]">
                    {tr(
                      locale,
                      "Ingen ekstern betalingsleverandør er tilkoblet. Betaling bekreftes som test/manuelt i Vendure (dummy-payment-handler).",
                      "No external PSP is wired in; payment settles via Vendure’s configured manual/dummy handler.",
                    )}
                  </p>
                </form>
              </Reveal>

              <Reveal delay={0.15}>
                <aside className="sticky top-28 rounded-[3px] bg-[var(--color-dark-bg)] p-6 text-[var(--color-stone)] lg:p-8">
                  <h3 className="text-[16px] font-bold uppercase tracking-[0.12em] text-white">{tr(locale, "Ordreoversikt", "Order summary")}</h3>

                  <ul className="mt-6 divide-y divide-[var(--color-dark-border)]">
                    {lines.map((line) => (
                      <li key={line.orderLineId} className="flex items-start gap-3 py-4">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[2px] bg-[oklch(0.21_0_0)]">
                          <StorefrontRemoteImage
                            src={line.imageSrc}
                            alt=""
                            locale={locale}
                            fill
                            compact
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold leading-snug text-white">{line.productName}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--color-dark-muted)]">
                            {displayBrandName(line.brand)} · {line.quantity}{" "}
                            {locale === "en" ? "pcs" : "stk"}
                          </p>
                        </div>
                        <p className="whitespace-nowrap font-mono text-[13px] text-[var(--color-copper)]">
                          kr {formatNOK(Math.round(line.lineTotalKr))}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-5 space-y-2 border-t border-[var(--color-dark-border)] pt-5 text-[13px]">
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-dark-muted)]">{tr(locale, "Antall", "Qty")}</dt>
                      <dd>{itemCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-dark-muted)]">{tr(locale, "Sum inkl. MVA", "Total incl. VAT")}</dt>
                      <dd className="font-mono">kr {formatNOK(Math.round(subtotal))}</dd>
                    </div>
                  </dl>

                  <ul className="mt-6 space-y-3 text-[12px] text-[var(--color-dark-muted)]">
                    <li className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[var(--color-copper)]" /> {tr(locale, "Levering hele Norge", "Nationwide delivery")}
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[var(--color-copper)]" /> {tr(locale, "Profesjonell support", "Professional support")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--color-copper)]" /> {tr(locale, "Admin / Vendure", "Admin / Vendure")}
                    </li>
                  </ul>
                </aside>
              </Reveal>
            </div>
          )}
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function Section({ title, step, children }: { title: string; step: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-6 lg:p-8">
      <div className="mb-6 flex items-baseline gap-3">
        <span className="font-mono text-[12px] tracking-[0.16em] text-[var(--color-copper)]">/{step}</span>
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-[var(--color-ink)]">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldInput({
  label,
  required,
  type = "text",
  value,
  onChange,
  error,
  disabled,
  passwordToggle,
  maxLength,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
  passwordToggle?: { show: string; hide: string };
  maxLength?: number;
}) {
  const inputClasses = `w-full rounded-[2px] border bg-white px-4 py-3 text-[14px] transition-colors focus:outline-none ${
    error ? "border-red-600 focus:border-red-700" : "border-[var(--color-divider)] focus:border-[var(--color-copper)]"
  } disabled:opacity-60`;

  return (
    <div>
      <label className="mb-2 block text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
        {required ? " *" : ""}
      </label>
      {type === "password" && passwordToggle ?
        <PasswordWithToggle
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="new-password"
          showLabel={passwordToggle.show}
          hideLabel={passwordToggle.hide}
          className={`${inputClasses} pr-11`}
        />
      : <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          className={inputClasses}
        />
      }
      {error ? <p className="mt-2 text-[12px] text-red-700">{error}</p> : null}
    </div>
  );
}
