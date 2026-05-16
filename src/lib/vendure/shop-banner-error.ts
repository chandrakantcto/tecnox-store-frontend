type GraphQlErrorShape = { errors?: Array<{ message: string }> };

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
  return t.replace(/^\[vendure\]\s*/i, "").trim();
}
