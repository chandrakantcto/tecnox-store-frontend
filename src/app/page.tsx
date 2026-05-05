import { Brands } from "@/components/site/Brands";
import { Categories } from "@/components/site/Categories";
import { Faq } from "@/components/site/Faq";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { MainNav } from "@/components/site/MainNav";
import { Newsletter } from "@/components/site/Newsletter";
import { Products } from "@/components/site/Products";
import { References } from "@/components/site/References";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { Service as ServiceBand } from "@/components/site/Service";
import { TopBar } from "@/components/site/TopBar";
import { TrustStats } from "@/components/site/TrustStats";
import { WhyUs } from "@/components/site/WhyUs";
import { getServerLocale } from "@/lib/locale.server";

export default async function HomePage() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-screen bg-[var(--color-stone)]">
      <ScrollProgress />
      <header className="sticky top-0 z-50">
        <TopBar locale={locale} />
        <MainNav />
      </header>
      <Hero locale={locale} />
      <Categories locale={locale} />
      <WhyUs locale={locale} />
      <Products locale={locale} />
      <TrustStats locale={locale} />
      <Brands locale={locale} />
      <ServiceBand locale={locale} />
      <References locale={locale} />
      <Faq locale={locale} />
      <Newsletter locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
