import { getRelatedProducts, type Product } from "@/lib/products";
import { ProductPageTemplate } from "@/components/site/ProductPageTemplate";
import type { Locale } from "@/lib/locale";

export function SingleProductPage({
  product,
  relatedProducts,
  locale,
}: {
  product: Product;
  relatedProducts?: Product[];
  locale?: Locale;
}) {
  return (
    <ProductPageTemplate
      product={product}
      relatedProducts={relatedProducts ?? getRelatedProducts(product)}
      locale={locale}
    />
  );
}
