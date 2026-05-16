/** Vendure `Money` scalar is integer minor units (øre) over JSON. */
export function formatMoneyMinorKr(m: unknown): string {
  if (m == null || m === "") return "—";
  const n = typeof m === "number" ? m : typeof m === "string" ? Number(m) : Number.NaN;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("nb-NO").format(Math.round(n / 100));
}
