export const GLOBAL_DISCLAIMERS = {
  noGuarantee:
    "Results are not guaranteed. Outcomes depend on the information provided, the accuracy of the record, and the response of the credit bureaus and furnishers.",
  notLegalAdvice:
    "This platform provides administrative credit-repair support and workflow tools. It does not provide legal advice or form an attorney-client relationship.",
  consumerResponsibility:
    "Clients remain responsible for reviewing submissions, confirming factual accuracy, and responding promptly to document, payment, and identity-verification requests.",
  paymentTerms:
    "No service fee is collected upfront. Payment is requested only when the file reaches the final release stage under the platform’s payment terms.",
} as const;

export function buildOutputDisclaimerBlock() {
  return [
    "Important Notice",
    GLOBAL_DISCLAIMERS.noGuarantee,
    GLOBAL_DISCLAIMERS.notLegalAdvice,
    GLOBAL_DISCLAIMERS.consumerResponsibility,
  ].join("\n");
}

export function buildPaymentTermsDisclaimer() {
  return GLOBAL_DISCLAIMERS.paymentTerms;
}

export function buildDashboardDisclaimerLines() {
  return [
    GLOBAL_DISCLAIMERS.noGuarantee,
    GLOBAL_DISCLAIMERS.notLegalAdvice,
    GLOBAL_DISCLAIMERS.paymentTerms,
  ];
}

export function buildIntakeAcknowledgmentLines() {
  return [
    GLOBAL_DISCLAIMERS.noGuarantee,
    GLOBAL_DISCLAIMERS.notLegalAdvice,
    GLOBAL_DISCLAIMERS.consumerResponsibility,
    GLOBAL_DISCLAIMERS.paymentTerms,
  ];
}
