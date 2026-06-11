import { getVendureServerConfigOrNull } from "@/lib/vendure/env";
import { normalizeAuthEmail } from "@/lib/auth/email-validation";

const CUSTOMERS_BY_EMAIL = /* GraphQL */ `
  query CustomersByEmail($email: String!) {
    customers(options: { filter: { emailAddress: { eq: $email } }, take: 1 }) {
      totalItems
    }
  }
`;

function resolveAdminApiUrl(): string | null {
  const explicit = process.env.VENDURE_ADMIN_API_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const shop = getVendureServerConfigOrNull()?.shopApiUrl;
  if (!shop) return null;
  if (shop.endsWith("/shop-api")) return shop.replace(/\/shop-api$/, "/admin-api");
  return null;
}

/**
 * Returns whether a customer email exists in Vendure.
 * `null` when admin lookup is not configured (no token / URL).
 */
export async function isCustomerEmailRegistered(email: string): Promise<boolean | null> {
  const adminUrl = resolveAdminApiUrl();
  const adminToken = process.env.VENDURE_ADMIN_API_TOKEN?.trim();
  if (!adminUrl || !adminToken) return null;

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
