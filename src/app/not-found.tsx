import Link from "next/link";
import { SiteShell } from "@/components/site/SiteShell";
import { getMegaMenuBothLocales } from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";
import { tr } from "@/lib/locale";

export default async function NotFound() {
  const locale = await getServerLocale();
  const { data } = await getMegaMenuBothLocales();

  return (
    <SiteShell locale={locale} megaMenuByLocale={data}>
      <main className="section-pad bg-[var(--stone)] py-24">
        <div className="container-x text-center">
          <p className="label-tag mb-4">404</p>
          <h1 className="display-h2 text-[var(--ink)]">{tr(locale, "Siden finnes ikke", "Page not found")}</h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-[var(--muted-foreground)]">
            {tr(locale, "Lenken kan være utdatert, eller siden er flyttet.", "The link may be outdated, or the page has moved.")}
          </p>
          <Link href="/" className="btn-primary mt-10 inline-flex">
            {tr(locale, "Til forsiden", "Back to homepage")}
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}
