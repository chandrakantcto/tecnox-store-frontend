export const GQL_SUBMIT_QUOTE_REQUEST = /* GraphQL */ `
  mutation SubmitQuoteRequest($input: SubmitQuoteRequestInput!) {
    submitQuoteRequest(input: $input) {
      success
      message
    }
  }
`;

export const GQL_SUBMIT_CONTACT_ENQUIRY = /* GraphQL */ `
  mutation SubmitContactEnquiry($input: SubmitContactEnquiryInput!) {
    submitContactEnquiry(input: $input) {
      success
      message
    }
  }
`;

export const GQL_SUBSCRIBE_NEWSLETTER = /* GraphQL */ `
  mutation SubscribeNewsletter($email: String!) {
    subscribeNewsletter(email: $email) {
      success
      message
    }
  }
`;

export type SubmitLeadResultJson = {
  submitQuoteRequest?: { success: boolean; message?: string | null };
  submitContactEnquiry?: { success: boolean; message?: string | null };
  subscribeNewsletter?: { success: boolean; message?: string | null };
};
