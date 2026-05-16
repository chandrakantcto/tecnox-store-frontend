/**
 * Vendor channel credentials + language header. Shop API URL is resolved only via `@/config/vendure`.
 */
import { resolveVendureShopConfig, vendureShopEnvVarName, type VendurePublicConfig } from "@/config/vendure";

export type { VendurePublicConfig } from "@/config/vendure";

export type VendureServerConfig = VendurePublicConfig & {
  channelToken: string;
};

export function getVendurePublicConfig(): VendurePublicConfig | null {
  return resolveVendureShopConfig();
}

function channelTokenFromEnv(): string {
  const a = typeof process.env.VENDURE_CHANNEL_TOKEN === "string" ? process.env.VENDURE_CHANNEL_TOKEN.trim() : "";
  const b =
    typeof process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN === "string"
      ? process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN.trim()
      : "";
  return a || b;
}

export function getVendureServerConfigOrNull(): VendureServerConfig | null {
  const pub = resolveVendureShopConfig();
  const channelToken = channelTokenFromEnv();
  if (!pub || !channelToken) return null;
  return { ...pub, channelToken };
}

export function getVendureServerConfig(): VendureServerConfig {
  const c = getVendureServerConfigOrNull();
  if (!c) {
    const missing: string[] = [];
    if (!resolveVendureShopConfig()) missing.push(vendureShopEnvVarName());
    if (!channelTokenFromEnv()) missing.push("VENDURE_CHANNEL_TOKEN (optional alt: NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN)");
    throw new Error(
      `[vendure] Missing ${missing.join(" and ")}. Configure your environment — see tecnox-store-frontend/.env.example.`,
    );
  }
  return c;
}

export function vendureLanguageCode(locale: string): string {
  return locale === "en" ? "en" : "nb";
}
