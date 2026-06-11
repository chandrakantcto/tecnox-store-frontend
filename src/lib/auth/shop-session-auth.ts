import { shopGraphql } from "@/lib/vendure/shop-client-browser";
import {
  emailAlreadyRegisteredMessage,
  emailNotRegisteredMessage,
  incorrectPasswordMessage,
  loginFailedMessage,
} from "@/lib/auth/auth-messages";
import { normalizeAuthEmail } from "@/lib/auth/email-validation";
import {
  GQL_LOGIN_NATIVE,
  GQL_REGISTER_CUSTOMER,
  GQL_REGISTER_ISOLATED_CUSTOMER,
} from "@/lib/vendure/shop-auth-documents";

export type PostCheckoutAuthResult =
  | { ok: true; authMode: "login" | "signup" }
  | { ok: false; error: string };

function pickMutation(data: unknown, key: string): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const v = (data as Record<string, unknown>)[key];
  if (!v || typeof v !== "object") return null;
  return v as Record<string, unknown>;
}

function errorMessageFromMutationPayload(payload: Record<string, unknown> | null, fallback: string): string {
  if (!payload) return fallback;
  const msg = typeof payload.message === "string" ? payload.message.trim() : "";
  if (msg) return msg;
  const ve =
    typeof (payload as { validationErrorMessage?: unknown }).validationErrorMessage === "string"
      ? (payload as { validationErrorMessage: string }).validationErrorMessage.trim()
      : "";
  if (ve) return ve;
  const code = typeof payload.errorCode === "string" ? payload.errorCode : "";
  const tn = typeof payload.__typename === "string" ? payload.__typename : "";
  return tn || code ? `${tn || fallback} (${code || "?"})` : fallback;
}

async function doLogin(email: string, password: string, locale: string) {
  return shopGraphql<{ login: unknown }>(
    GQL_LOGIN_NATIVE,
    { username: email, password, rememberMe: true },
    locale,
  );
}

async function doRegister(
  email: string,
  input: { firstName: string; lastName: string; phoneNumber?: string; password: string },
  locale: string,
  useIsolated: boolean,
) {
  const mutation = useIsolated ? GQL_REGISTER_ISOLATED_CUSTOMER : GQL_REGISTER_CUSTOMER;
  const key = useIsolated ? "registerIsolatedCustomerAccount" : "registerCustomerAccount";
  return shopGraphql<Record<string, unknown>>(mutation, { input: { emailAddress: email, ...input } }, locale).then(
    (res) => ({ ...res, key }),
  );
}

function registerSucceeded(payload: Record<string, unknown> | null): boolean {
  return payload?.__typename === "Success" && payload.success === true;
}

/**
 * Uses the checkout session bearer token after order placement:
 * try native login → on invalid credentials attempt register then login again.
 */
export async function loginOrRegisterAfterCheckout(
  input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  },
  locale: string,
): Promise<PostCheckoutAuthResult> {
  const lc = locale === "en" ? "en" : "nb";
  const email = normalizeAuthEmail(input.email);
  if (!email || !input.password?.length) {
    return { ok: false, error: "E-post og passord kreves for å fullføre konto." };
  }

  let loginRes = await doLogin(email, input.password, lc);
  if (loginRes.networkError || loginRes.graphqlErrors.length) {
    return {
      ok: false,
      error: loginRes.networkError ?? loginRes.graphqlErrors.join("; ") ?? "Kunne ikke logge inn.",
    };
  }

  let loginPayload = pickMutation(loginRes.data, "login");
  let tn = typeof loginPayload?.__typename === "string" ? loginPayload.__typename : "";

  if (tn === "CurrentUser") {
    return { ok: true, authMode: "login" };
  }

  if (tn !== "InvalidCredentialsError" && tn !== "NotVerifiedError") {
    return { ok: false, error: errorMessageFromMutationPayload(loginPayload, "Innlogging mislyktes.") };
  }

  let reg = await doRegister(
    email,
    {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneNumber: input.phoneNumber?.trim() || undefined,
      password: input.password,
    },
    lc,
    true,
  );
  if (reg.graphqlErrors.some((e) => e.includes("registerIsolatedCustomerAccount"))) {
    reg = await doRegister(
      email,
      {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber?.trim() || undefined,
        password: input.password,
      },
      lc,
      false,
    );
  }

  if (reg.networkError || reg.graphqlErrors.length) {
    return {
      ok: false,
      error: reg.networkError ?? reg.graphqlErrors.join("; ") ?? "Kunne ikke opprette konto.",
    };
  }
  const regPayload = pickMutation(reg.data, reg.key);
  if (!registerSucceeded(regPayload)) {
    return { ok: false, error: errorMessageFromMutationPayload(regPayload, "Konto ble ikke opprettet.") };
  }

  loginRes = await doLogin(email, input.password, lc);
  if (loginRes.networkError || loginRes.graphqlErrors.length) {
    return {
      ok: false,
      error:
        loginRes.networkError ??
        loginRes.graphqlErrors.join("; ") ??
        "Konto opprettet, men pålogging mislyktes. Prøv «Logg inn» manuelt.",
    };
  }
  loginPayload = pickMutation(loginRes.data, "login");
  tn = typeof loginPayload?.__typename === "string" ? loginPayload.__typename : "";

  if (tn === "CurrentUser") {
    return { ok: true, authMode: "signup" };
  }

  const wrongPw =
    tn === "InvalidCredentialsError"
      ? "Feil passord for denne e-postadressen. Bruk samme passord som for din eksisterende konto."
      : errorMessageFromMutationPayload(loginPayload, "Kunne ikke logge inn etter registering.");
  return { ok: false, error: wrongPw };
}

export async function shopLoginEmailPassword(
  email: string,
  password: string,
  locale: string,
  options?: { emailRegistered?: boolean | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const lc = locale === "en" ? "en" : "nb";
  const loginRes = await doLogin(normalizeAuthEmail(email), password, lc);
  if (loginRes.networkError || loginRes.graphqlErrors.length) {
    return {
      ok: false,
      error: loginRes.networkError ?? loginRes.graphqlErrors.join("; ") ?? "Feil ved innlogging.",
    };
  }
  const loginPayload = pickMutation(loginRes.data, "login");
  const tn = typeof loginPayload?.__typename === "string" ? loginPayload.__typename : "";
  if (tn === "CurrentUser") return { ok: true };

  if (tn === "InvalidCredentialsError") {
    if (options?.emailRegistered === false) {
      return { ok: false, error: emailNotRegisteredMessage(lc) };
    }
    if (options?.emailRegistered === true) {
      return { ok: false, error: incorrectPasswordMessage(lc) };
    }
    return { ok: false, error: loginFailedMessage(lc) };
  }

  return { ok: false, error: errorMessageFromMutationPayload(loginPayload, "Innlogging mislyktes.") };
}

export async function shopRegisterAccount(
  input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  },
  locale: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const lc = locale === "en" ? "en" : "nb";
  const email = normalizeAuthEmail(input.email);

  const existingLogin = await doLogin(email, input.password, lc);
  const existingPayload = pickMutation(existingLogin.data, "login");
  if (existingPayload?.__typename === "CurrentUser") {
    return { ok: false, error: emailAlreadyRegisteredMessage(lc) };
  }

  let reg = await doRegister(
    email,
    {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneNumber: input.phoneNumber?.trim() || undefined,
      password: input.password,
    },
    lc,
    true,
  );
  if (reg.graphqlErrors.some((e) => e.includes("registerIsolatedCustomerAccount"))) {
    reg = await doRegister(
      email,
      {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber?.trim() || undefined,
        password: input.password,
      },
      lc,
      false,
    );
  }

  if (reg.networkError || reg.graphqlErrors.length) {
    return {
      ok: false,
      error: reg.networkError ?? reg.graphqlErrors.join("; ") ?? "Registrering feilet.",
    };
  }

  const regPayload = pickMutation(reg.data, reg.key);
  if (!registerSucceeded(regPayload)) {
    return { ok: false, error: errorMessageFromMutationPayload(regPayload, "Registrering feilet.") };
  }

  const loginResult = await shopLoginEmailPassword(email, input.password, lc);
  if (!loginResult.ok) {
    return { ok: false, error: emailAlreadyRegisteredMessage(lc) };
  }
  return { ok: true };
}
