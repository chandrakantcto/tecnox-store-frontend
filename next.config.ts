import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

function patternFromShopApiUrl(raw: string | undefined): RemotePattern | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const protocol = u.protocol === "http:" ? ("http" as const) : ("https" as const);
    const hostname = u.hostname;
    const port = u.port || undefined;
    return { protocol, hostname, ...(port ? { port } : {}), pathname: "/**" };
  } catch {
    return null;
  }
}

/** Allow `next/image` for vendor asset host(s) declared at build time — no literals in-app. */
function vendorImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [];
  const seen = new Set<string>();

  for (const raw of [process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL, process.env.VENDURE_SHOP_API_URL]) {
    const pattern = patternFromShopApiUrl(raw);
    if (!pattern) continue;
    const key = `${pattern.protocol}://${pattern.hostname}${"port" in pattern && pattern.port ? `:${pattern.port}` : ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    patterns.push(pattern);
  }

  // Local Vendure dev server — also covers stale localhost previews before rewrite runs.
  if (process.env.NODE_ENV === "development") {
    patterns.push({ protocol: "http", hostname: "localhost", port: "3000", pathname: "/**" });
  }

  return patterns;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      ...vendorImageRemotePatterns(),
    ],
  },
};

export default nextConfig;
