import { vendureShopQuery } from './src/lib/vendure/shop-fetch';
import { GQL_STOREFRONT_PRODUCT_PDP_EXTRA } from './src/lib/vendure/queries';

async function test() {
  const res = await vendureShopQuery(GQL_STOREFRONT_PRODUCT_PDP_EXTRA, { slug: "polsegrill7-ruller268636" }, "nb");
  console.log(JSON.stringify(res, null, 2));
}

test().catch(console.error);
