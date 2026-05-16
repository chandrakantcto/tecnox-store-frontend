/** Extra pages for storefrontCollectionCounts only (catalogue > `VENDURE_SHOP_LIST_MAX_TAKE`). */

export const GQL_COLLECTION_COUNTS_PAGE = /* GraphQL */ `
  query StorefrontCollectionCountsPage($take: Int!, $skip: Int!) {
    storefrontCollectionCounts: collections(options: { take: $take, skip: $skip }) {
      items {
        id
        productVariantCount
      }
      totalItems
    }
  }
`;
