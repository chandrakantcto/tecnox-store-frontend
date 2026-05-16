/** Shop API operations for cart + guest checkout */

export const GQL_ACTIVE_ORDER = /* GraphQL */ `
  query ActiveOrderForCart {
    activeOrder {
      id
      code
      state
      active
      totalQuantity
      subTotal
      subTotalWithTax
      currencyCode
      lines {
        id
        quantity
        linePrice
        discountedLinePrice
        discountedUnitPrice
        productVariant {
          id
          sku
          name
          featuredAsset {
            preview
          }
          product {
            slug
            name
          }
        }
      }
    }
  }
`;

export const GQL_ADD_ITEM_TO_ORDER = /* GraphQL */ `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      __typename
      ... on Order {
        __typename
        id
        totalQuantity
      }
      ... on OrderModificationError {
        errorCode
        message
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_ADJUST_ORDER_LINE = /* GraphQL */ `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      __typename
      ... on Order {
        __typename
        id
        totalQuantity
      }
      ... on OrderModificationError {
        errorCode
        message
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_REMOVE_ORDER_LINE = /* GraphQL */ `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      __typename
      ... on Order {
        __typename
        id
        totalQuantity
      }
      ... on OrderModificationError {
        errorCode
        message
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_REMOVE_ALL_ORDER_LINES = /* GraphQL */ `
  mutation RemoveAllOrderLines {
    removeAllOrderLines {
      __typename
      ... on Order {
        __typename
        id
        totalQuantity
      }
      ... on OrderModificationError {
        errorCode
        message
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_SET_CUSTOMER_FOR_ORDER = /* GraphQL */ `
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      __typename
      ... on Order {
        __typename
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_SET_ORDER_SHIPPING_ADDRESS = /* GraphQL */ `
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      __typename
      ... on Order {
        __typename
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_SET_ORDER_BILLING_ADDRESS = /* GraphQL */ `
  mutation SetOrderBillingAddress($input: CreateAddressInput!) {
    setOrderBillingAddress(input: $input) {
      __typename
      ... on Order {
        __typename
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_ELIGIBLE_SHIPPING_METHODS = /* GraphQL */ `
  query EligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      code
      priceWithTax
    }
  }
`;

export const GQL_SET_ORDER_SHIPPING_METHOD = /* GraphQL */ `
  mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      __typename
      ... on Order {
        __typename
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GQL_TRANSITION_ORDER_STATE = /* GraphQL */ `
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      __typename
      ... on Order {
        __typename
        id
        state
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
      }
    }
  }
`;

/** For checkout: read current state so we never request ArrangingPayment when already there. */
export const GQL_ACTIVE_ORDER_CHECKOUT_SNAPSHOT = /* GraphQL */ `
  query ActiveOrderCheckoutSnapshot {
    activeOrder {
      id
      code
      state
    }
  }
`;

export const GQL_NEXT_ORDER_STATES = /* GraphQL */ `
  query NextOrderStates {
    nextOrderStates
  }
`;

export const GQL_ELIGIBLE_PAYMENT_METHODS = /* GraphQL */ `
  query EligiblePaymentMethodsForOrder {
    eligiblePaymentMethods {
      id
      code
      name
    }
  }
`;

/** Detach session from the completed order so `activeOrder` is empty (ArrangingPayment / manual checkout). */
export const GQL_RELEASE_CHECKOUT_CART = /* GraphQL */ `
  mutation ReleaseCheckoutCart($orderCode: String!) {
    releaseCheckoutCart(orderCode: $orderCode) {
      success
      message
    }
  }
`;

export const GQL_ADD_PAYMENT_TO_ORDER = /* GraphQL */ `
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      __typename
      ... on Order {
        __typename
        id
        code
        state
        active
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;
