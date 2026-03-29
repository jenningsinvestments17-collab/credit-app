import type { DomainActorType, DomainEventType } from "@/lib/types";
import type {
  CanonicalContractStatus,
  CanonicalDisputeStatus,
  CanonicalDocumentStatus,
  CanonicalIntakeStepStatus,
  CanonicalLeadStatus,
  CanonicalMailingStatus,
} from "@/lib/statuses";

export type OnboardingLifecycleStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_review"
  | "completed";

export type WorkflowFamily =
  | "lead"
  | "intake_step"
  | "document"
  | "dispute"
  | "mailing"
  | "contract"
  | "onboarding";

export type WorkflowStatusByFamily = {
  lead: CanonicalLeadStatus;
  intake_step: CanonicalIntakeStepStatus;
  document: CanonicalDocumentStatus;
  dispute: CanonicalDisputeStatus;
  mailing: CanonicalMailingStatus;
  contract: CanonicalContractStatus;
  onboarding: OnboardingLifecycleStatus;
};

export type TransitionGuardContext = {
  hasDisputeDraft?: boolean;
  hasAllBureauReports?: boolean;
  hasAllRequiredDocuments?: boolean;
  hasFinalPdf?: boolean;
  isPaymentConfirmed?: boolean;
  contractPacketSent?: boolean;
  hasAnyContractSignature?: boolean;
  hasAllContractSignatures?: boolean;
  intakeComplete?: boolean;
  intakeStepPayloadComplete?: boolean;
  reportsComplete?: boolean;
  documentsReadyForReview?: boolean;
  adminApproved?: boolean;
};

export type TransitionGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export type TransitionGuard = (
  context: TransitionGuardContext,
) => TransitionGuardResult;

export type WorkflowTransition<F extends WorkflowFamily = WorkflowFamily> = {
  family: F;
  fromStatus: WorkflowStatusByFamily[F];
  toStatus: WorkflowStatusByFamily[F];
  trigger: string;
  actorType: DomainActorType;
  requiredConditions: string[];
  emittedEvents: DomainEventType[];
  sideEffects: string[];
  guards?: TransitionGuard[];
};

export type TransitionCheckResult<F extends WorkflowFamily = WorkflowFamily> = {
  allowed: boolean;
  transition?: WorkflowTransition<F>;
  reason?: string;
};
