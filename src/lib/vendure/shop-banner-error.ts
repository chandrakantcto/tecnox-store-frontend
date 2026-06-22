type GraphQlErrorShape = { errors?: Array<{ message: string }> };

const TRANSIENT_NETWORK =
  /ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|ENOTFOUND|socket hang up|fetch failed|network/i;

function dedupeSemicolonParts(text: string): string {
  const parts = text
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return text.trim();
  return [...new Set(parts)].join("; ");
}

function friendlyConnectionMessage(text: string): string {
  const low = text.toLowerCase();
  const looksLikeNetwork =
    TRANSIENT_NETWORK.test(text) ||
    low.includes("network reset") ||
    low.includes("connection failed") ||
    low.includes("shop api connection");
  if (!looksLikeNetwork) return text;
  return (
    "Kunne ikke nå Shop API (nettverksfeil). Prøv å laste siden på nytt. " +
    "Vedvarende feil: sjekk at Vendure-backend kjører og at storefront peker på riktig API-adresse."
  );
}

/** Extract messages from a parsed GraphQL error body `{ errors:[…] }` or `[{ message, … }, …]` */
export function graphqlMessagesFromParsedBody(parsed: unknown): string[] {
  if (!parsed || typeof parsed !== "object") return [];
  if (Array.isArray(parsed)) {
    return parsed
      .map((e) =>
        e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "",
      )
      .filter(Boolean);
  }
  const err = (parsed as GraphQlErrorShape).errors;
  return Array.isArray(err) ? err.map((e) => e.message).filter(Boolean) : [];
}

/** Human-readable banner text from `[vendure] …`, `HTTP xxx: [{"message":"…"},…]` or `{ errors:[…] }`. */
export function formatShopBannerError(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const afterHttp = t.replace(/^HTTP\s+\d+:\s+/, "").trim();
  try {
    const parsed = JSON.parse(afterHttp) as unknown;
    const msgs = graphqlMessagesFromParsedBody(parsed);
    if (msgs.length) return msgs.join("; ");
  } catch {
    /* not JSON */
  }
  const stripped = t.replace(/^\[vendure\]\s*/i, "").trim();
  const deduped = dedupeSemicolonParts(stripped);
  return friendlyConnectionMessage(deduped);
}
