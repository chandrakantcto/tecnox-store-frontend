import type { Locale } from "@/lib/locale";
import { pickLocale } from "@/lib/locale";

export function resolveEmailLocaleFromRequest(request: Request, bodyLocale?: unknown): Locale {
  const header = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (header.startsWith("en")) return "en";
  if (typeof bodyLocale === "string") return pickLocale(bodyLocale);
  return "nb";
}
