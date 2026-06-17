import { tr, type Locale } from "@/lib/locale";
import { formatMoneyMinorKr } from "@/lib/vendure/money-display";

export function orderStateLabel(state: string, lc: Locale): string {
  const labels: Record<string, [string, string]> = {
    ArrangingPayment: ["Arrangerer betaling", "Arranging payment"],
    AddingItems: ["Handlekurv", "Cart"],
    PaymentAuthorized: ["Betaling godkjent", "Payment authorized"],
    PaymentSettled: ["Betalt", "Paid"],
    Shipped: ["Sendt", "Shipped"],
    Delivered: ["Levert", "Delivered"],
    Cancelled: ["Kansellert", "Cancelled"],
  };
  const hit = labels[state];
  return hit ? tr(lc, hit[0], hit[1]) : state;
}

export function orderStateTone(state: string): string {
  if (state === "ArrangingPayment" || state === "AddingItems") {
    return "text-amber-700";
  }
  if (state === "PaymentSettled" || state === "Delivered" || state === "Shipped") {
    return "text-emerald-700";
  }
  if (state === "Cancelled") return "text-red-700";
  return "text-[var(--color-muted)]";
}

export function formatOrderTotalSummary(lc: Locale, totalWithTax: unknown, totalQuantity: number): string {
  const kr = formatMoneyMinorKr(totalWithTax).replace(/,-$/, "");
  const count = totalQuantity > 0 ? totalQuantity : 1;
  const word = count === 1 ? tr(lc, "produkt", "product") : tr(lc, "produkter", "products");
  return `kr ${kr} ${tr(lc, "for", "for")} ${count} ${word}`;
}

export function formatOrderDate(value: string | null, lc: Locale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(lc === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
