import { Brands } from "@/components/site/Brands";
import { Categories } from "@/components/site/Categories";
import { Faq } from "@/components/site/Faq";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/site/Hero";
import { Newsletter } from "@/components/site/Newsletter";
import { Products } from "@/components/site/Products";
import { References } from "@/components/site/References";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { Service as ServiceBand } from "@/components/site/Service";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TrustStats } from "@/components/site/TrustStats";
import { WhyUs } from "@/components/site/WhyUs";
import { getHomepageCatalogPayload } from "@/lib/vendure/catalog-data";
import { getServerLocale } from "@/lib/locale.server";

export default async function HomePage() {
  const locale = await getServerLocale();
  const catalog = await getHomepageCatalogPayload(locale);

  return (
    <main className=" bg-[var(--color-stone)]">
      <ScrollProgress />
      <SiteHeader locale={locale} />
      <Hero locale={locale} />
      <Categories
        key={`home-categories-${locale}`}
        locale={locale}
        tiles={catalog.categories}
        categoriesCopy={catalog.categoriesSectionCopy}
        catalogError={catalog.error}
      />
      <WhyUs locale={locale} />
      <Products key={`home-products-${locale}`} locale={locale} catalog={catalog.productsBlock} />
      <TrustStats locale={locale} />
      <Brands locale={locale} />
      <ServiceBand locale={locale} />
      <References locale={locale} />
      <Faq locale={locale} />
      <Newsletter locale={locale} />
      <SiteFooter locale={locale} />
    </main>
  );
}
