import type { CheckoutFormValues } from "@/lib/checkout/validate";
import { shopGraphql } from "@/lib/vendure/shop-client-browser";
import {
  GQL_ACTIVE_ORDER_CHECKOUT_SNAPSHOT,
  GQL_ADD_PAYMENT_TO_ORDER,
  GQL_ELIGIBLE_PAYMENT_METHODS,
  GQL_RELEASE_CHECKOUT_CART,
  GQL_ELIGIBLE_SHIPPING_METHODS,
  GQL_SET_CUSTOMER_FOR_ORDER,
  GQL_SET_ORDER_BILLING_ADDRESS,
  GQL_SET_ORDER_SHIPPING_ADDRESS,
  GQL_SET_ORDER_SHIPPING_METHOD,
  GQL_TRANSITION_ORDER_STATE,
} from "@/lib/vendure/shop-order-documents";

function humanizeGraphError(prefix: string, networkError: string | null, graphqlErrors: string[]): string {
  if (networkError) return `${prefix}: ${networkError}`;
  if (graphqlErrors.length) return `${prefix}: ${graphqlErrors.join("; ")}`;
  return `${prefix}: Ukjent feil`;
}

function pickMutation(data: unknown, key: string): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object") return undefined;
  const v = (data as Record<string, unknown>)[key];
  if (!v || typeof v !== "object") return undefined;
  return v as Record<string, unknown>;
}

function errorFromOrderishPayload(payload: Record<string, unknown> | undefined): string | null {
  if (!payload) return "Tom svar fra butikk-API.";
  const tn = typeof payload.__typename === "string" ? payload.__typename : "";
  if (tn === "Order") return null;
  const msg = typeof payload.message === "string" ? payload.message : null;
  return msg ?? `Operasjonen mislyktes (${tn || "unknown"})`;
}

export type GuestCheckoutResult =
  | { ok: true; orderId: string; orderCode: string; orderState: string; paymentSkipped?: boolean }
  | { ok: false; error: string };

const ARRANGING_PAYMENT = "ArrangingPayment";

function vendureCheckoutSkipPaymentFromEnv(): boolean {
  return typeof process.env.NEXT_PUBLIC_VENDURE_CHECKOUT_SKIP_PAYMENT === "string"
    ? process.env.NEXT_PUBLIC_VENDURE_CHECKOUT_SKIP_PAYMENT.trim().toLowerCase() === "true"
    : false;
}

async function activeOrderCheckoutSnapshot(
  locale: string,
): Promise<
  | { ok: false; networkError?: string | null; graphqlErrors: string[] }
  | { ok: true; id: string; code: string; state: string }
> {
  const res = await shopGraphql<{ activeOrder: { id?: unknown; code?: unknown; state?: unknown } | null | undefined }>(
    GQL_ACTIVE_ORDER_CHECKOUT_SNAPSHOT,
    undefined,
    locale,
  );
  if (res.networkError || res.graphqlErrors.length) {
    return { ok: false, networkError: res.networkError, graphqlErrors: res.graphqlErrors };
  }
  const o = res.data?.activeOrder;
  const idRaw = o && typeof o === "object" && typeof (o as { id?: unknown }).id !== "undefined" ? String((o as { id: string | number }).id) : "";
  const codeRaw = o && typeof o === "object" && typeof (o as { code?: unknown }).code === "string" ? (o as { code: string }).code : "";
  const stateRaw =
    o && typeof o === "object" && typeof (o as { state?: unknown }).state === "string" ? (o as { state: string }).state : "";
  const id = idRaw.trim();
  const code = codeRaw.trim();
  const state = stateRaw.trim();
  if (!code || !state || !id) return { ok: false, graphqlErrors: ["Fant ikke aktiv ordre (mangler kode/status)."] };
  return { ok: true, id, code, state };
}

async function releaseCheckoutCartSession(orderCode: string, locale: string): Promise<void> {
  const trimmed = orderCode.trim();
  if (!trimmed) return;

  let res = await shopGraphql<{ releaseCheckoutCart?: { success?: unknown; message?: unknown } | null }>(
    GQL_RELEASE_CHECKOUT_CART,
    { orderCode: trimmed },
    locale,
  );
  const ok1 = res.data?.releaseCheckoutCart?.success === true;
  const tryAgain = Boolean(res.networkError || res.graphqlErrors.length > 0 || !ok1);
  if (tryAgain) {
    await new Promise((r) => setTimeout(r, 150));
    res = await shopGraphql<{ releaseCheckoutCart?: { success?: unknown; message?: unknown } | null }>(
      GQL_RELEASE_CHECKOUT_CART,
      { orderCode: trimmed },
      locale,
    );
  }

  const payload = res.data?.releaseCheckoutCart;
  if (payload?.success !== true) {
    const msg =
      typeof payload?.message === "string" ? payload.message : res.graphqlErrors.join("; ") || res.networkError || "?";
    console.warn("[checkout] releaseCheckoutCart failed:", msg);
  }
}

/** Build Shop API shipping/billing address (billing matches shipping — single checkout block). */
function buildCheckoutAddress(values: CheckoutFormValues, fullName: string): {
  fullName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province?: string;
  postalCode: string;
  countryCode: string;
  company?: string;
  phoneNumber: string;
  customFields?: { organizationNumber: string };
} {
  const countryCode = values.countryCode.trim().toUpperCase().slice(0, 2);
  const org = values.orgNumber.trim();

  const input = {
    fullName,
    streetLine1: values.addressLine1.trim(),
    ...(values.addressLine2.trim().length ? { streetLine2: values.addressLine2.trim() } : {}),
    city: values.city.trim(),
    province: values.state.trim(),
    postalCode: values.postalCode.trim().replace(/\s+/g, ""),
    countryCode,
    ...(values.company.trim().length >= 2 ? { company: values.company.trim() } : {}),
    phoneNumber: values.phone.trim(),
    ...(org.length ? { customFields: { organizationNumber: org } } : {}),
  };

  return input;
}

/**
 * Sequential guest checkout using the browser’s persisted Vendure session (active cart).
 */
export async function runVendureGuestCheckout(
  values: CheckoutFormValues,
  options: {
    locale: string;
    /** Omit `setCustomerForOrder`: required when Shop session already has Customer (Otherwise Vendure returns ALREADY_LOGGED_IN_ERROR). */
    skipSetCustomer?: boolean;
  },
): Promise<GuestCheckoutResult> {
  const { locale, skipSetCustomer } = options;

  const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();

  if (!skipSetCustomer) {
    const customerRes = await shopGraphql<{ setCustomerForOrder: unknown }>(
      GQL_SET_CUSTOMER_FOR_ORDER,
      {
        input: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          emailAddress: values.email.trim().toLowerCase(),
          phoneNumber: values.phone.trim() || undefined,
        },
      },
      locale,
    );
    if (customerRes.networkError || customerRes.graphqlErrors.length) {
      return {
        ok: false,
        error: humanizeGraphError("Kunne ikke sette kunde på ordren", customerRes.networkError, customerRes.graphqlErrors),
      };
    }
    const custPayload = pickMutation(customerRes.data, "setCustomerForOrder");
    const custErr = errorFromOrderishPayload(custPayload);
    if (custErr) return { ok: false, error: custErr };
  }

  const shippingAddr = buildCheckoutAddress(values, fullName);

  const shipRes = await shopGraphql<{ setOrderShippingAddress: unknown }>(
    GQL_SET_ORDER_SHIPPING_ADDRESS,
    { input: shippingAddr },
    locale,
  );
  if (shipRes.networkError || shipRes.graphqlErrors.length) {
    return {
      ok: false,
      error: humanizeGraphError("Kunne ikke sette leveringsadresse", shipRes.networkError, shipRes.graphqlErrors),
    };
  }
  const shipPayload = pickMutation(shipRes.data, "setOrderShippingAddress");
  const shipMutationErr = errorFromOrderishPayload(shipPayload);
  if (shipMutationErr) return { ok: false, error: shipMutationErr };

  const billRes = await shopGraphql<{ setOrderBillingAddress: unknown }>(
    GQL_SET_ORDER_BILLING_ADDRESS,
    { input: shippingAddr },
    locale,
  );
  if (billRes.networkError || billRes.graphqlErrors.length) {
    return {
      ok: false,
      error: humanizeGraphError("Kunne ikke sette fakturaadresse", billRes.networkError, billRes.graphqlErrors),
    };
  }
  const billPayload = pickMutation(billRes.data, "setOrderBillingAddress");
  const billMutationErr = errorFromOrderishPayload(billPayload);
  if (billMutationErr) return { ok: false, error: billMutationErr };

  const eligShip = await shopGraphql<{
    eligibleShippingMethods: Array<{ id?: unknown; name?: unknown }> | null;
  }>(GQL_ELIGIBLE_SHIPPING_METHODS, undefined, locale);
  if (eligShip.networkError || eligShip.graphqlErrors.length) {
    return {
      ok: false,
      error: humanizeGraphError("Kunne ikke hente fraktmetoder", eligShip.networkError, eligShip.graphqlErrors),
    };
  }
  const methods = Array.isArray(eligShip.data?.eligibleShippingMethods) ? eligShip.data!.eligibleShippingMethods : [];
  if (methods.length) {
    const firstId = methods[0];
    const idStr =
      firstId && typeof firstId === "object" && (typeof firstId.id === "string" || typeof firstId.id === "number")
        ? String(firstId.id)
        : "";
    if (idStr) {
      const setShip = await shopGraphql<{ setOrderShippingMethod: unknown }>(
        GQL_SET_ORDER_SHIPPING_METHOD,
        { shippingMethodId: [idStr] },
        locale,
      );
      if (setShip.networkError || setShip.graphqlErrors.length) {
        return {
          ok: false,
          error: humanizeGraphError("Kunne ikke velge frakt", setShip.networkError, setShip.graphqlErrors),
        };
      }
      const setShipPayload = pickMutation(setShip.data, "setOrderShippingMethod");
      const setShipErr = errorFromOrderishPayload(setShipPayload);
      if (setShipErr) return { ok: false, error: setShipErr };
    }
  }

  const snapBeforeTransition = await activeOrderCheckoutSnapshot(locale);
  if (!snapBeforeTransition.ok) {
    return {
      ok: false,
      error: humanizeGraphError(
        "Fant ikke aktiv ordre",
        snapBeforeTransition.networkError ?? null,
        snapBeforeTransition.graphqlErrors,
      ),
    };
  }

  if (snapBeforeTransition.state !== ARRANGING_PAYMENT) {
    const tr = await shopGraphql<{ transitionOrderToState: unknown }>(
      GQL_TRANSITION_ORDER_STATE,
      { state: ARRANGING_PAYMENT },
      locale,
    );
    if (tr.networkError || tr.graphqlErrors.length) {
      return {
        ok: false,
        error: humanizeGraphError("Kunne ikke gå til betaling/levering", tr.networkError, tr.graphqlErrors),
      };
    }
    const trPayload = pickMutation(tr.data, "transitionOrderToState");
    if (!trPayload) return { ok: false, error: "Ugyldig svar ved statusendring." };
    const trTn = typeof trPayload.__typename === "string" ? trPayload.__typename : "";
    if (trTn === "OrderStateTransitionError") {
      const recover = await activeOrderCheckoutSnapshot(locale);
      if (recover.ok && recover.state === ARRANGING_PAYMENT) {
        /* order already arranging payment — treat as success */
      } else {
        const parts = [
          typeof trPayload.message === "string" ? trPayload.message : null,
          typeof trPayload.transitionError === "string" ? trPayload.transitionError : null,
        ].filter(Boolean);
        return { ok: false, error: parts.join(" — ") || "Kunne ikke endre ordrestatus." };
      }
    } else if (trTn !== "Order") {
      const msg = typeof trPayload.message === "string" ? trPayload.message : "Kunne ikke endre ordrestatus.";
      return { ok: false, error: msg };
    }
  }

  const payQ = await shopGraphql<{ eligiblePaymentMethods: Array<{ code?: unknown }> | null }>(
    GQL_ELIGIBLE_PAYMENT_METHODS,
    undefined,
    locale,
  );
  if (payQ.networkError || payQ.graphqlErrors.length) {
    return {
      ok: false,
      error: humanizeGraphError("Kunne ikke hente betalingsmetoder", payQ.networkError, payQ.graphqlErrors),
    };
  }
  const payMethods = Array.isArray(payQ.data?.eligiblePaymentMethods) ? payQ.data!.eligiblePaymentMethods : [];
  /** Prefer seeded dummy/manual handler codes when multiple exist */
  let methodCode =
    payMethods.map((p) => (typeof p?.code === "string" ? p.code : "")).find((c) => c.includes("dummy")) ??
    payMethods.map((p) => (typeof p?.code === "string" ? p.code : "")).find((c) => c.trim().length > 0) ??
    "";

  const skipPayment = vendureCheckoutSkipPaymentFromEnv() || !methodCode;
  if (skipPayment) {
    const snap = await activeOrderCheckoutSnapshot(locale);
    if (!snap.ok) {
      return {
        ok: false,
        error: humanizeGraphError("Kunne ikke bekrefte ordre etter betalingssteg", snap.networkError ?? null, snap.graphqlErrors),
      };
    }
    await releaseCheckoutCartSession(snap.code, locale);
    return {
      ok: true,
      orderId: snap.id,
      orderCode: snap.code,
      orderState: snap.state,
      paymentSkipped: true,
    };
  }

  const orgTrim = values.orgNumber.trim();
  const payNotes = JSON.stringify({
    organizationNumber: orgTrim.length ? orgTrim : undefined,
    countryCode: values.countryCode.trim().toUpperCase().slice(0, 2),
  });

  const payRes = await shopGraphql<{ addPaymentToOrder: unknown }>(
    GQL_ADD_PAYMENT_TO_ORDER,
    {
      input: {
        method: methodCode,
        metadata: { notes: payNotes },
      },
    },
    locale,
  );
  if (payRes.networkError || payRes.graphqlErrors.length) {
    return {
      ok: false,
      error: humanizeGraphError("Kunne ikke fullføre bestilling/betaling", payRes.networkError, payRes.graphqlErrors),
    };
  }

  const payPayload = pickMutation(payRes.data, "addPaymentToOrder");
  const payMutationErr = errorFromOrderishPayload(payPayload);
  if (payMutationErr) return { ok: false, error: payMutationErr };
  const code = typeof payPayload?.code === "string" ? payPayload.code.trim() : "";
  const orderIdRaw = typeof payPayload?.id !== "undefined" ? String((payPayload as { id?: string | number }).id).trim() : "";
  const orderState = typeof payPayload?.state === "string" ? payPayload.state : "";
  if (!code.length) return { ok: false, error: "Bestilling gjennomført uten ordrekode — kontakt oss hvis du trenger sporingsnummer." };
  if (!orderIdRaw.length) return { ok: false, error: "Bestilling mangler ordre-ID — kontakt support." };
  await releaseCheckoutCartSession(code, locale);
  return { ok: true, orderId: orderIdRaw, orderCode: code, orderState };
}
