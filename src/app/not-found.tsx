import Link from "next/link";
import { SiteShell } from "@/components/site/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <main className="section-pad bg-[var(--stone)] py-24">
        <div className="container-x text-center">
          <p className="label-tag mb-4">404</p>
          <h1 className="display-h2 text-[var(--ink)]">Siden finnes ikke</h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-[var(--muted-foreground)]">Lenken kan være utdatert, eller siden er flyttet.</p>
          <Link href="/" className="btn-primary mt-10 inline-flex">
            Til forsiden
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}
