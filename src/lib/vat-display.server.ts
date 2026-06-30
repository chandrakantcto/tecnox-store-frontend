import { cookies } from "next/headers";
import { pickVatIncluded, VAT_DISPLAY_COOKIE } from "@/lib/vat-display";

export async function getServerVatIncluded(): Promise<boolean> {
  const cookieStore = await cookies();
  return pickVatIncluded(cookieStore.get(VAT_DISPLAY_COOKIE)?.value);
}
