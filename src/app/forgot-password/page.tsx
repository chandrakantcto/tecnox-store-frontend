"use client";

import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MainNav } from "@/components/site/MainNav";
import { PageHero } from "@/components/site/PageHero";
import { TopBar } from "@/components/site/TopBar";
import heroImg from "@/assets/hero-combi.jpg";
import { useLocale } from "@/contexts/LocaleContext";
import { tr } from "@/lib/locale";

export default function ForgotPasswordPage() {
  const { locale: lc } = useLocale();

  return (
    <main className=" bg-[var(--color-stone)]">
      <header className="sticky top-0 z-50">
        <TopBar />
        <MainNav />
      </header>

      <PageHero
        label={tr(lc, "Konto", "Account")}
        title={tr(lc, "Glemt passord", "Forgot Password")}
        description={tr(lc, "Tilbakestill passordet ditt.", "Reset your account password.")}
        crumbs={[{ label: tr(lc, "Glemt passord", "Forgot Password") }]}
        bgImage={heroImg}
        locale={lc}
      />

      <section className="container-x section-pad max-w-xl">
        <div className="rounded-[3px] border border-[var(--color-divider)] bg-white p-8">
          <ForgotPasswordForm />
        </div>
      </section>

      <SiteFooter locale={lc} />
    </main>
  );
}
