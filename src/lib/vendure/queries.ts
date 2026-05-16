/** Shop API operations for navigation & product listing */

/** Maximum `take` allowed on Vendure shop list queries (collections, etc.). */
export const VENDURE_SHOP_LIST_MAX_TAKE = 100;

/** Storefront-facing Channel.customFields (Shop API requires sub-selection when relation fields exist). */
const FRAG_CHANNEL_STOREFRONT = /* GraphQL */ `
  fragment ChannelStorefrontCustomFields on Channel {
    id
    customFields {
      homepageCategoriesEyebrow
      homepageCategoriesHeading
      homepageCategoriesSupportingText
      homepageCategoriesEmptyMessage
      homepageCategoriesSeeAllLabel
      categoriesListingHeroLabel
      categoriesListingHeroTitle
      categoriesListingHeroDescription
      categoriesListingMetaTitle
      categoriesListingMetaDescription
      categoriesListingHeroImage {
        id
        preview
        source
      }
      productsListingHeroLabel
      productsListingHeroTitle
      productsListingHeroDescription
      productsListingMetaTitle
      productsListingMetaDescription
      productsListingHeroImage {
        id
        preview
        source
      }
    }
  }
`;

/** /kategorier only: homepage categories copy + `/kategorier` hero/meta (no `/produkter` channel fields). */
const FRAG_CHANNEL_KATEGORIER = /* GraphQL */ `
  fragment ChannelKategorierFields on Channel {
    id
    customFields {
      homepageCategoriesEyebrow
      homepageCategoriesHeading
      homepageCategoriesSupportingText
      homepageCategoriesEmptyMessage
      homepageCategoriesSeeAllLabel
      categoriesListingHeroLabel
      categoriesListingHeroTitle
      categoriesListingHeroDescription
      categoriesListingMetaTitle
      categoriesListingMetaDescription
      categoriesListingHeroImage {
        id
        preview
        source
      }
    }
  }
`;

/** Shared counts + nested collection tree (same as storefront nav minus Channel fragment selection). */
const GQL_NAV_COLLECTIONS_CORE = /* GraphQL */ `
  storefrontCollectionCounts: collections(options: { take: 100, skip: 0 }) {
    items {
      id
      productVariantCount
    }
    totalItems
  }
  collections(options: { topLevelOnly: true }) {
    items {
      id
      slug
      name
      position
      parentId
      featuredAsset {
        id
        preview
        source
      }
      children {
        id
        slug
        name
        position
        parentId
        featuredAsset {
          id
          preview
          source
        }
        children {
          id
          slug
          name
          position
          parentId
          featuredAsset {
            id
            preview
            source
          }
        }
      }
    }
    totalItems
  }
`;

/**
 * Flat counts + nested tree **without** tree `productVariantCount` selections.
 * (Vendure’s bulk count cache keyed only to flat `collections` items; nesting would read partial cache → 0.)
 * NOTE: Shop API list queries enforce `take` ≤ **100**.
 */
export const GQL_NAV_COLLECTIONS = /* GraphQL */ `
  ${FRAG_CHANNEL_STOREFRONT}
  query StorefrontNavCollectionsAndCategoriesCopy {
    activeChannel {
      ...ChannelStorefrontCustomFields
    }
    ${GQL_NAV_COLLECTIONS_CORE}
  }
`;

/** Lighter nav query for `/kategorier` (smaller Channel payload, no Shop search on the page). */
export const GQL_NAV_COLLECTIONS_KATEGORIER = /* GraphQL */ `
  ${FRAG_CHANNEL_KATEGORIER}
  query KategorierNavCollections {
    activeChannel {
      ...ChannelKategorierFields
    }
    ${GQL_NAV_COLLECTIONS_CORE}
  }
`;

export const GQL_SEARCH_PRODUCTS = /* GraphQL */ `
  query SearchProductsForStorefront($input: SearchInput!) {
    search(input: $input) {
      items {
        sku
        slug
        productId
        productName
        description
        productAsset {
          preview
          id
        }
        priceWithTax {
          __typename
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
        collectionIds
      }
      totalItems
    }
  }
`;

export const GQL_STOREFRONT_PRODUCT = /* GraphQL */ `
  query StorefrontProduct($slug: String!) {
    product(slug: $slug) {
      id
      slug
      name
      description
      featuredAsset {
        preview
        source
      }
      assets {
        preview
        source
      }
      optionGroups {
        id
        code
        name
        options {
          id
          code
          name
        }
      }
      collections {
        id
        slug
        name
      }
      facetValues {
        code
        name
        facet {
          code
          name
        }
      }
      variants {
        id
        sku
        name
        priceWithTax
        stockLevel
        featuredAsset {
          preview
          source
        }
        options {
          id
          code
          name
          groupId
          group {
            id
            code
            name
          }
        }
        facetValues {
          code
          name
          facet {
            code
            name
          }
        }
      }
    }
  }
`;

/** Optional: only runs when Product custom field definitions exist on the server — failures are ignored. */
export const GQL_STOREFRONT_PRODUCT_PDP_EXTRA = /* GraphQL */ `
  query StorefrontProductPdpExtra($slug: String!) {
    product(slug: $slug) {
      id
      customFields {
        storefrontReviewsJson
        storefrontServiceBulletsJson
        storefrontQuoteBulletsJson
      }
    }
  }
`;