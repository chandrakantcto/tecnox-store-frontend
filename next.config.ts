import type { NextConfig } from "next";

/** Allow `next/image` for vendor asset host(s) declared at build time — no literals in-app. */
function vendorImageRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const raw = process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL?.trim();
  if (!raw) return [];
  try {
    const u = new URL(raw);
    const protocol =
      u.protocol === "http:" ? ("http" as const) : ("https" as const);
    const hostname = u.hostname;
    const port = u.port || undefined;
    return [{ protocol, hostname, ...(port ? { port } : {}), pathname: "/**" }];
  } catch {
    return [];
  }
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
