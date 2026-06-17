/** Shop API — customer auth, profile, orders */

export const GQL_LOGIN_NATIVE = /* GraphQL */ `
  mutation ShopLogin($username: String!, $password: String!, $rememberMe: Boolean!) {
    login(username: $username, password: $password, rememberMe: $rememberMe) {
      __typename
      ... on CurrentUser {
        id
        identifier
      }
      ... on InvalidCredentialsError {
        errorCode
        message
      }
      ... on NotVerifiedError {
        errorCode
        message
      }
      ... on NativeAuthStrategyError {
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

export const GQL_REGISTER_CUSTOMER = /* GraphQL */ `
  mutation RegisterCustomerAccount($input: RegisterCustomerInput!) {
    registerCustomerAccount(input: $input) {
      __typename
      ... on Success {
        success
      }
      ... on MissingPasswordError {
        errorCode
        message
      }
      ... on PasswordValidationError {
        errorCode
        message
        validationErrorMessage
      }
      ... on NativeAuthStrategyError {
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

export const GQL_REGISTER_ISOLATED_CUSTOMER = /* GraphQL */ `
  mutation RegisterIsolatedCustomerAccount($input: RegisterCustomerInput!) {
    registerIsolatedCustomerAccount(input: $input) {
      __typename
      ... on Success {
        success
      }
      ... on MissingPasswordError {
        errorCode
        message
      }
      ... on PasswordValidationError {
        errorCode
        message
        validationErrorMessage
      }
      ... on NativeAuthStrategyError {
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

export const GQL_FORCE_PASSWORD_RESET = /* GraphQL */ `
  mutation ForcePasswordReset($emailAddress: String!, $newPassword: String!, $secret: String!) {
    forcePasswordReset(emailAddress: $emailAddress, newPassword: $newPassword, secret: $secret)
  }
`;

export const GQL_LOGOUT = /* GraphQL */ `
  mutation ShopLogout {
    logout {
      success
    }
  }
`;

export const GQL_ACTIVE_CUSTOMER_PANEL = /* GraphQL */ `
  query ActiveCustomerPanel {
    activeCustomer {
      id
      emailAddress
      firstName
      lastName
      phoneNumber
      addresses {
        id
        fullName
        streetLine1
        streetLine2
        city
        postalCode
        phoneNumber
        defaultShippingAddress
        defaultBillingAddress
        country {
          code
        }
      }
    }
    me {
      id
      identifier
    }
  }
`;

export const GQL_CUSTOMER_ORDER_LIST = /* GraphQL */ `
  query CustomerOrderList($options: OrderListOptions) {
    activeCustomer {
      id
      orders(options: $options) {
        totalItems
        items {
          id
          code
          state
          orderPlacedAt
          createdAt
          currencyCode
          totalQuantity
          subTotalWithTax
          shippingWithTax
          totalWithTax
        }
      }
    }
  }
`;

export const GQL_ORDER_DETAIL = /* GraphQL */ `
  query ShopOrderDetail($id: ID!) {
    order(id: $id) {
      id
      code
      state
      active
      orderPlacedAt
      createdAt
      currencyCode
      totalQuantity
      subTotal
      subTotalWithTax
      shippingWithTax
      totalWithTax
      shippingAddress {
        fullName
        streetLine1
        city
        postalCode
        countryCode
        phoneNumber
      }
      billingAddress {
        fullName
        streetLine1
        city
        postalCode
        countryCode
        phoneNumber
      }
      lines {
        id
        quantity
        unitPriceWithTax
        discountedUnitPriceWithTax
        linePriceWithTax
        discountedLinePriceWithTax
        productVariant {
          name
          sku
          featuredAsset {
            preview
          }
          product {
            name
            slug
          }
        }
      }
    }
  }
`;

export const GQL_CREATE_CUSTOMER_ADDRESS = /* GraphQL */ `
  mutation CreateCustomerAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      id
      fullName
      streetLine1
      streetLine2
      city
      postalCode
      phoneNumber
      country {
        code
      }
    }
  }
`;

export const GQL_UPDATE_CUSTOMER = /* GraphQL */ `
  mutation UpdateCustomerShop($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      emailAddress
      firstName
      lastName
      phoneNumber
    }
  }
`;

export const GQL_UPDATE_CUSTOMER_PASSWORD = /* GraphQL */ `
  mutation UpdateCustomerPasswordShop($currentPassword: String!, $newPassword: String!) {
    updateCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      __typename
      ... on Success {
        success
      }
      ... on InvalidCredentialsError {
        errorCode
        message
      }
      ... on PasswordValidationError {
        errorCode
        message
        validationErrorMessage
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`;
