import { ProductPageTemplate } from "@/components/site/ProductPageTemplate";
import type { Product } from "@/lib/catalog/storefront-product";
import type { Locale } from "@/lib/locale";
import type { MegaMenuLocales } from "@/lib/vendure/catalog-types";

export function SingleProductPage({
  product,
  relatedProducts = [],
  locale,
  megaMenuByLocale,
}: {
  product: Product;
  relatedProducts?: Product[];
  locale?: Locale;
  megaMenuByLocale?: MegaMenuLocales;
}) {
  return (
    <ProductPageTemplate
      product={product}
      relatedProducts={relatedProducts}
      locale={locale}
      megaMenuByLocale={megaMenuByLocale}
    />
  );
}
