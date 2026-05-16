import { NextResponse } from "next/server";
import { getVendureServerConfigOrNull } from "@/lib/vendure/env";

type Body = {
  query?: unknown;
  variables?: Record<string, unknown>;
  locale?: unknown;
};

/**
 * Proxies Shop GraphQL to Vendure with server-side channel token.
 * Forwards `Authorization: Bearer …` from the browser and returns `vendure-auth-token` when Vendure issues a session.
 */
export async function POST(req: Request) {
  const cfg = getVendureServerConfigOrNull();
  if (!cfg) {
    return NextResponse.json(
      { errors: [{ message: "Vendure Shop API is not configured on the server." }] },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ errors: [{ message: "Invalid JSON body." }] }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query.length) {
    return NextResponse.json({ errors: [{ message: "Missing GraphQL query." }] }, { status: 400 });
  }

  const variables = body.variables && typeof body.variables === "object" ? body.variables : undefined;
  const lc = body.locale === "en" ? "en" : "nb";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "vendure-token": cfg.channelToken,
    "vendure-language-code": lc,
  };

  const auth = req.headers.get("authorization")?.trim();
  if (auth) {
    headers.Authorization = auth;
  }

  try {
    const upstream = await fetch(cfg.shopApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    const json = (await upstream.json()) as unknown;
    const res = NextResponse.json(json);

    const token = upstream.headers.get("vendure-auth-token");
    if (token != null && token.length > 0) {
      res.headers.set("vendure-auth-token", token);
    }

    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ errors: [{ message: msg }] }, { status: 502 });
  }
}
