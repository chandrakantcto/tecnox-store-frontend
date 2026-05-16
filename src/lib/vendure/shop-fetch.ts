import { vendureLikelyWrongApiEndpointHint, vendureShopEnvVarName } from "@/config/vendure";
import { getVendureServerConfigOrNull, vendureLanguageCode } from "@/lib/vendure/env";
import { graphqlMessagesFromParsedBody } from "@/lib/vendure/shop-banner-error";

type GraphQlResponse<T> = { data?: T; errors?: Array<{ message: string }> };

/** POST to Vendure Shop API (SSR / route handlers only). */
export async function vendureShopQuery<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  locale: string,
): Promise<{ data: T | null; error: string | null }> {
  const cfg = getVendureServerConfigOrNull();
  if (!cfg) {
    return {
      data: null,
      error: `[vendure] Set ${vendureShopEnvVarName()} (vendor Shop GraphQL URL) and VENDURE_CHANNEL_TOKEN — see tecnox-store-frontend/.env.example`,
    };
  }

  const endpointMisconfig = vendureLikelyWrongApiEndpointHint(cfg.shopApiUrl);
  if (endpointMisconfig) {
    return {
      data: null,
      error: `[vendure] ${endpointMisconfig}`,
    };
  }
  try {
    const res = await fetch(cfg.shopApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "vendure-token": cfg.channelToken,
        "vendure-language-code": vendureLanguageCode(locale),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    const json = (await res.json()) as GraphQlResponse<T>;
    if (!res.ok) {
      const msgs = graphqlMessagesFromParsedBody(json);
      const summary =
        msgs.length > 0
          ? `[vendure] ${msgs.join("; ")}`
          : `[vendure] HTTP ${res.status}: Shop API request failed`;
      return { data: null, error: summary };
    }
    if (json.errors?.length) {
      const msgs = json.errors.map((e) => e.message).join("; ");
      let errStr = `[vendure] ${msgs}`;
      const low = msgs.toLowerCase();
      const looksLead =
        low.includes("submitquote") ||
        low.includes("submitcontact") ||
        low.includes("submitquoterequest") ||
        low.includes("unknown type \"submitquote");
      if (looksLead) {
        const hint = vendureLikelyWrongApiEndpointHint(cfg.shopApiUrl);
        errStr += hint
          ? ` (${hint})`
          : " The vendor server handling this URL is running without storefront lead mutations — usually an old/stale process. In backend repo run `npm run build`, then restart the Vendure server (same host/port as NEXT_PUBLIC_VENDURE_SHOP_API_URL; local backend typically uses PORT in backend/.env, e.g. 3002).";
      }
      return {
        data: json.data ?? null,
        error: errStr,
      };
    }
    return { data: json.data ?? null, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { data: null, error: msg };
  }
}
