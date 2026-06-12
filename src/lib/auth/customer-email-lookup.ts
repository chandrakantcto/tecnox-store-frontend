import { getVendureServerConfigOrNull } from "@/lib/vendure/env";
import { normalizeAuthEmail } from "@/lib/auth/email-validation";

const CUSTOMERS_BY_EMAIL = /* GraphQL */ `
  query CustomersByEmail($email: String!) {
    customers(options: { filter: { emailAddress: { eq: $email } }, take: 1 }) {
      totalItems
    }
  }
`;

const ADMIN_AUTH = /* GraphQL */ `
  mutation AdminAuth($username: String!, $password: String!) {
    authenticate(input: { native: { username: $username, password: $password } }) {
      __typename
      ... on CurrentUser {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

type CachedAdminToken = { token: string; expiresAt: number };
let cachedAdminToken: CachedAdminToken | null = null;

function resolveAdminApiUrl(): string | null {
  const explicit = process.env.VENDURE_ADMIN_API_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const shop = getVendureServerConfigOrNull()?.shopApiUrl;
  if (!shop) return null;
  if (shop.endsWith("/shop-api")) return shop.replace(/\/shop-api$/, "/admin-api");
  return null;
}

function extractBearerFromSessionCookie(setCookieHeaders: string[]): string | null {
  const sessionHeader = setCookieHeaders.find((header) => header.startsWith("session="));
  if (!sessionHeader) return null;

  const sessionValue = sessionHeader.split(";")[0]?.replace(/^session=/, "").trim();
  if (!sessionValue) return null;

  try {
    const decoded = JSON.parse(Buffer.from(sessionValue, "base64").toString("utf8")) as { token?: string };
    return typeof decoded.token === "string" && decoded.token.length > 0 ? decoded.token : null;
  } catch {
    return null;
  }
}

async function resolveAdminAuthToken(adminUrl: string): Promise<string | null> {
  const staticToken = process.env.VENDURE_ADMIN_API_TOKEN?.trim();
  if (staticToken) return staticToken;

  if (cachedAdminToken && cachedAdminToken.expiresAt > Date.now()) {
    return cachedAdminToken.token;
  }

  const username = process.env.VENDURE_ADMIN_USERNAME?.trim();
  const password = process.env.VENDURE_ADMIN_PASSWORD?.trim();
  if (!username || !password) return null;

  try {
    const res = await fetch(adminUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: ADMIN_AUTH,
        variables: { username, password },
      }),
      cache: "no-store",
    });

    const setCookieHeaders =
      typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    const token = extractBearerFromSessionCookie(setCookieHeaders);
    if (!token) return null;

    cachedAdminToken = { token, expiresAt: Date.now() + 5 * 60 * 1000 };
    return token;
  } catch {
    return null;
  }
}

/**
 * Returns whether a customer email exists in Vendure.
 * `null` when admin lookup is not configured (no token / credentials / URL).
 */
export async function isCustomerEmailRegistered(email: string): Promise<boolean | null> {
  const adminUrl = resolveAdminApiUrl();
  if (!adminUrl) return null;

  const adminToken = await resolveAdminAuthToken(adminUrl);
  if (!adminToken) return null;

  const normalized = normalizeAuthEmail(email);
  try {
    const res = await fetch(adminUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        query: CUSTOMERS_BY_EMAIL,
        variables: { email: normalized },
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      data?: { customers?: { totalItems?: number } };
      errors?: Array<{ message: string }>;
    };
    if (!res.ok || json.errors?.length) return null;
    return (json.data?.customers?.totalItems ?? 0) > 0;
  } catch {
    return null;
  }
}
