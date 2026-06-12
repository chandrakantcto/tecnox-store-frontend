import { getVendureServerConfigOrNull, vendureLanguageCode } from "@/lib/vendure/env";

export function getShopAuthTokenFromRequest(request: Request): string | null {
  const headerToken = request.headers.get("vendure-auth-token") ?? request.headers.get("Vendure-Auth-Token");
  if (headerToken?.trim()) return headerToken.trim();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)vendure-auth-token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export type VerifiedShopCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
};

export type VerifiedShopOrderLine = {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  unitPriceWithTax?: number;
  discountedLinePriceWithTax?: number;
  discountedUnitPriceWithTax?: number;
  productVariant: {
    id: string;
    name: string;
    sku?: string;
    featuredAsset?: { preview?: string };
    product: { name: string; slug: string };
  };
};

export type VerifiedShopOrder = {
  id: string;
  code: string;
  state: string;
  orderPlacedAt?: string | null;
  createdAt: string;
  totalWithTax: number;
  shippingWithTax: number;
  shippingAddress?: {
    fullName?: string;
    streetLine1?: string;
    streetLine2?: string;
    city?: string;
    postalCode?: string;
    countryCode?: string;
    phoneNumber?: string;
  };
  lines: VerifiedShopOrderLine[];
};

const VERIFY_ORDER_QUERY = /* GraphQL */ `
  query VerifyShopOrder($id: ID!) {
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
    }
    order(id: $id) {
      id
      code
      state
      orderPlacedAt
      createdAt
      totalWithTax
      shippingWithTax
      shippingAddress {
        fullName
        streetLine1
        streetLine2
        city
        postalCode
        countryCode
        phoneNumber
      }
      lines {
        id
        quantity
        unitPriceWithTax
        discountedUnitPriceWithTax
        linePriceWithTax
        discountedLinePriceWithTax
        productVariant {
          id
          name
          sku
          featuredAsset {
            preview
          }
          product {
            name
            slug
          }
        }
      }
    }
  }
`;

export async function verifyShopOrderForCustomer(
  authToken: string | null,
  orderId: string,
  locale = "nb",
): Promise<{ customer: VerifiedShopCustomer | null; order: VerifiedShopOrder | null }> {
  const cfg = getVendureServerConfigOrNull();
  if (!cfg || !authToken) return { customer: null, order: null };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "vendure-token": cfg.channelToken,
    "vendure-language-code": vendureLanguageCode(locale),
    Authorization: `Bearer ${authToken}`,
    "vendure-auth-token": authToken,
  };

  try {
    const res = await fetch(cfg.shopApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: VERIFY_ORDER_QUERY, variables: { id: orderId } }),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      data?: {
        activeCustomer?: VerifiedShopCustomer | null;
        order?: VerifiedShopOrder | null;
      };
      errors?: Array<{ message: string }>;
    };
    if (!res.ok || json.errors?.length) return { customer: null, order: null };
    const customer = json.data?.activeCustomer ?? null;
    const order = json.data?.order ?? null;
    if (!customer || !order) return { customer: null, order: null };
    return { customer, order };
  } catch {
    return { customer: null, order: null };
  }
}
