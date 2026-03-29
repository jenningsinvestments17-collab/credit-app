import { getRequiredDocumentState } from "@/lib/services/documentService";
import { getAiWorkflowStateForLead } from "@/lib/services/disputeService";
import type { Lead } from "@/lib/types";
import type { IntakeProgressStep, IntakeProfileData, IntakeStepId } from "@/types/intake";

const STEP_ORDER: IntakeStepId[] = [
  "profile",
  "disclosures",
  "contracts",
  "documents",
  "review",
];

export function getIntakeStepHref(step: IntakeStepId) {
  switch (step) {
    case "profile":
      return "/intake/profile";
    case "disclosures":
      return "/intake/disclosures";
    case "contracts":
      return "/intake/contracts";
    case "documents":
      return "/intake/documents";
    case "review":
      return "/intake/review";
    default:
      return "/intake/profile";
  }
}

export function normalizeProfileData(
  input: Partial<IntakeProfileData> | null | undefined,
  lead: Lead,
): IntakeProfileData {
  const [firstName = "", ...rest] = lead.fullName.split(" ");
  return {
    firstName: input?.firstName ?? firstName,
    lastName: input?.lastName ?? rest.join(" "),
    phone: input?.phone ?? lead.phone,
    city: input?.city ?? "",
    state: input?.state ?? "",
    primaryGoal: input?.primaryGoal ?? "",
  };
}

export function getAllowedIntakeStep(input: {
  profileCompleted: boolean;
  disclosuresAccepted: boolean;
  contractsAccepted: boolean;
  documentsReady: boolean;
}) {
  if (!input.profileCompleted) return "profile" satisfies IntakeStepId;
  if (!input.disclosuresAccepted) return "disclosures" satisfies IntakeStepId;
  if (!input.contractsAccepted) return "contracts" satisfies IntakeStepId;
  if (!input.documentsReady) return "documents" satisfies IntakeStepId;
  return "review" satisfies IntakeStepId;
}

export function canAccessIntakeStep(requestedStep: IntakeStepId, allowedStep: IntakeStepId) {
  return STEP_ORDER.indexOf(requestedStep) <= STEP_ORDER.indexOf(allowedStep);
}

export function buildIntakeProgressSteps(input: {
  allowedStep: IntakeStepId;
  requestedStep: IntakeStepId;
  documentsReady: boolean;
}): IntakeProgressStep[] {
  const requestedIndex = STEP_ORDER.indexOf(input.requestedStep);
  const allowedIndex = STEP_ORDER.indexOf(input.allowedStep);

  return [
    {
      id: "profile",
      title: "Profile",
      helper: "Basic identity and credit-goal details.",
      href: getIntakeStepHref("profile"),
      status: allowedIndex > 0 ? "complete" : requestedIndex === 0 ? "current" : "locked",
    },
    {
      id: "disclosures",
      title: "Disclosures",
      helper: "Required acknowledgments before onboarding continues.",
      href: getIntakeStepHref("disclosures"),
      status:
        allowedIndex > 1 ? "complete" : requestedIndex === 1 && allowedIndex >= 1 ? "current" : "locked",
    },
    {
      id: "contracts",
      title: "Contracts",
      helper: "Onboarding authorizations before uploads open.",
      href: getIntakeStepHref("contracts"),
      status:
        allowedIndex > 2 ? "complete" : requestedIndex === 2 && allowedIndex >= 2 ? "current" : "locked",
    },
    {
      id: "documents",
      title: "Documents",
      helper: "Required bureau reports, ID, and proof of address.",
      href: getIntakeStepHref("documents"),
      status:
        input.documentsReady
          ? "complete"
          : requestedIndex === 3 && allowedIndex >= 3
            ? "current"
            : "locked",
    },
    {
      id: "review",
      title: "Review",
      helper: "Final check before intake completion.",
      href: getIntakeStepHref("review"),
      status: requestedIndex === 4 && allowedIndex >= 4 ? "current" : "locked",
    },
  ];
}

export function deriveDocumentsReady(lead: Lead) {
  return getRequiredDocumentState(lead).allUploaded;
}

export function deriveReviewReady(lead: Lead) {
  return getAiWorkflowStateForLead(lead).eligibleForProcessing;
}
