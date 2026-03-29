import type { TransitionGuard, TransitionGuardContext } from "@/lib/workflows/transitionTypes";

function pass() {
  return { ok: true } as const;
}

function fail(reason: string) {
  return { ok: false, reason } as const;
}

export const requireDisputeDraft: TransitionGuard = (context) =>
  context.hasDisputeDraft ? pass() : fail("A dispute draft must exist first.");

export const requireAllBureauReports: TransitionGuard = (context) =>
  context.hasAllBureauReports
    ? pass()
    : fail("Experian, Equifax, and TransUnion reports are required first.");

export const requireAllRequiredDocuments: TransitionGuard = (context) =>
  context.hasAllRequiredDocuments
    ? pass()
    : fail("All required identity and address documents must be uploaded first.");

export const requireFinalPdf: TransitionGuard = (context) =>
  context.hasFinalPdf ? pass() : fail("A final mailing PDF must be generated first.");

export const requireConfirmedPayment: TransitionGuard = (context) =>
  context.isPaymentConfirmed
    ? pass()
    : fail("Mailing payment must be confirmed before this transition.");

export const requireContractPacketSent: TransitionGuard = (context) =>
  context.contractPacketSent
    ? pass()
    : fail("The contract packet must be sent before signatures can be recorded.");

export const requireAnyContractSignature: TransitionGuard = (context) =>
  context.hasAnyContractSignature
    ? pass()
    : fail("At least one signed contract is required for this transition.");

export const requireAllContractSignatures: TransitionGuard = (context) =>
  context.hasAllContractSignatures
    ? pass()
    : fail("All required packet signatures must be complete first.");

export const requireIntakeComplete: TransitionGuard = (context) =>
  context.intakeComplete ? pass() : fail("Intake must be completed first.");

export const requireIntakeStepPayload: TransitionGuard = (context) =>
  context.intakeStepPayloadComplete
    ? pass()
    : fail("This intake step is incomplete and cannot advance yet.");

export const requireDocumentsReadyForReview: TransitionGuard = (context) =>
  context.documentsReadyForReview
    ? pass()
    : fail("Documents must be complete and review-ready first.");

export const requireReportsComplete: TransitionGuard = (context) =>
  context.reportsComplete
    ? pass()
    : fail("All three bureau reports must be complete first.");

export const requireAdminApproval: TransitionGuard = (context) =>
  context.adminApproved ? pass() : fail("Admin approval is required first.");

export function runTransitionGuards(
  guards: TransitionGuard[] | undefined,
  context: TransitionGuardContext,
) {
  if (!guards || guards.length === 0) {
    return pass();
  }

  for (const guard of guards) {
    const result = guard(context);
    if (!result.ok) {
      return result;
    }
  }

  return pass();
}
