import { cookies } from "next/headers";
import { pickLocale } from "@/lib/locale";

export async function getServerLocale() {
  const cookieStore = await cookies();
  return pickLocale(cookieStore.get("site-locale")?.value);
}
