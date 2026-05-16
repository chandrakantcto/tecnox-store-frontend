"use client";

/** Session token storage — issued by Vendure as Bearer token (`vendure-auth-token` header on responses). */
const TOKEN_KEY = "tecnox.vendure-shop-session";

export function getStoredShopAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const t = sessionStorage.getItem(TOKEN_KEY)?.trim();
    return t?.length ? t : null;
  } catch {
    return null;
  }
}

export function setStoredShopAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token?.trim()) {
      sessionStorage.setItem(TOKEN_KEY, token.trim());
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore quota / privacy mode */
  }
}

type GraphqlPayload<T> = { data?: T; errors?: Array<{ message: string }> };

/** Browser-only: POST `/api/vendure/shop` with optional Bearer token; persists new tokens from upstream. */
export async function shopGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  locale?: string,
): Promise<{ data: T | null; graphqlErrors: string[]; networkError: string | null }> {
  let auth = getStoredShopAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    headers.Authorization = `Bearer ${auth}`;
  }

  let res: Response;
  try {
    res = await fetch("/api/vendure/shop", {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables, locale }),
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { data: null, graphqlErrors: [], networkError: msg };
  }

  const newer = res.headers.get("vendure-auth-token")?.trim();
  if (newer) {
    setStoredShopAuthToken(newer);
  }

  let json: GraphqlPayload<T>;
  try {
    json = (await res.json()) as GraphqlPayload<T>;
  } catch {
    return { data: null, graphqlErrors: [], networkError: "Invalid response from storefront API route." };
  }

  const graphqlErrors =
    json.errors?.map((er) => (typeof er?.message === "string" ? er.message : JSON.stringify(er))) ?? [];

  if (!res.ok && !graphqlErrors.length) {
    return { data: null, graphqlErrors: [], networkError: `HTTP ${res.status}` };
  }

  return { data: json.data ?? null, graphqlErrors, networkError: null };
}

export function errorMessageFromShopResult(networkError: string | null, graphqlErrors: string[]): string | null {
  if (networkError) return networkError;
  if (graphqlErrors.length) return graphqlErrors.join("; ");
  return null;
}
