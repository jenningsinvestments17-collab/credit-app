import { getNextUnsignedContract, isContractPacketFullySigned } from "@/lib/contracts";
import { getDocumentCounts, hasAllBureauReports, isLeadReadyForReview } from "@/lib/leads";
import type { ClientProgress, IntakeStepKey, IntakeWorkflowProgress, Lead, PortalStep } from "@/lib/types";

const stepMeta: Record<
  PortalStep,
  { label: string; route: string; action: string }
> = {
  account_created: {
    label: "Account created",
    route: "/dashboard",
    action: "Review your portal status",
  },
  profile_started: {
    label: "Basic details started",
    route: "/intake#intake-form",
    action: "Continue your intake details",
  },
  credit_goals_completed: {
    label: "Credit goals completed",
    route: "/intake#intake-form",
    action: "Continue your intake workflow",
  },
  report_readiness_completed: {
    label: "Report readiness confirmed",
    route: "/intake#report-readiness",
    action: "Review report readiness",
  },
  documents_partially_uploaded: {
    label: "Documents partially uploaded",
    route: "/intake#document-upload",
    action: "Upload the next missing document",
  },
  all_required_docs_uploaded: {
    label: "All required docs uploaded",
    route: "/dashboard",
    action: "Check review readiness",
  },
  ready_for_review: {
    label: "Ready for review",
    route: "/dashboard",
    action: "Open your portal dashboard",
  },
  contracts_sent: {
    label: "Contracts sent",
    route: "/dashboard/contracts",
    action: "Open your contract packet",
  },
  awaiting_signature: {
    label: "Awaiting signature",
    route: "/dashboard/contracts",
    action: "Review and sign your next document",
  },
  fully_signed: {
    label: "Fully signed",
    route: "/dashboard",
    action: "Return to your portal status",
  },
};

const orderedSteps: PortalStep[] = [
  "account_created",
  "profile_started",
  "credit_goals_completed",
  "report_readiness_completed",
  "documents_partially_uploaded",
  "all_required_docs_uploaded",
  "ready_for_review",
  "contracts_sent",
  "awaiting_signature",
  "fully_signed",
];

export function deriveClientProgress(lead: Lead): ClientProgress {
  const completedSteps: PortalStep[] = [];
  const counts = getDocumentCounts(lead.documents);
  const allReportsReady = hasAllBureauReports(lead.documents);
  const reviewReady = isLeadReadyForReview(lead);
  const packetFullySigned = isContractPacketFullySigned(lead.contractDocuments);
  const nextUnsignedContract = getNextUnsignedContract(lead.contractDocuments);

  if (lead.portalAccountCreated) completedSteps.push("account_created");
  if (lead.intakeStatus !== "not_started") completedSteps.push("profile_started");
  if (lead.intakeStatus === "in_progress" || lead.intakeStatus === "completed") {
    completedSteps.push("credit_goals_completed");
  }
  if (lead.reportReadiness !== "unknown") completedSteps.push("report_readiness_completed");
  if (counts.uploaded > 0) completedSteps.push("documents_partially_uploaded");
  if (counts.missing === 0 && allReportsReady) completedSteps.push("all_required_docs_uploaded");
  if (reviewReady) completedSteps.push("ready_for_review");
  if (lead.contractPacketStatus !== "not_sent") completedSteps.push("contracts_sent");
  if (packetFullySigned) completedSteps.push("fully_signed");

  let currentStep: PortalStep = "account_created";
  let nextStep: PortalStep = "profile_started";

  if (lead.intakeStatus === "not_started") {
    currentStep = "account_created";
    nextStep = "profile_started";
  } else if (lead.reportReadiness === "unknown") {
    currentStep = "credit_goals_completed";
    nextStep = "report_readiness_completed";
  } else if (counts.missing > 0) {
    currentStep = "report_readiness_completed";
    nextStep = "documents_partially_uploaded";
  } else if (reviewReady && lead.contractPacketStatus === "not_sent") {
    currentStep = "ready_for_review";
    nextStep = "ready_for_review";
  } else if (
    reviewReady &&
    (lead.contractPacketStatus === "sent" ||
      lead.contractPacketStatus === "awaiting_signature" ||
      lead.contractPacketStatus === "partially_signed")
  ) {
    currentStep = "contracts_sent";
    nextStep = "awaiting_signature";
  } else if (packetFullySigned || lead.contractPacketStatus === "completed") {
    currentStep = "fully_signed";
    nextStep = "fully_signed";
  } else if (!reviewReady) {
    currentStep = "documents_partially_uploaded";
    nextStep = "all_required_docs_uploaded";
  } else {
    currentStep = "ready_for_review";
    nextStep = "ready_for_review";
  }

  const currentIndex = orderedSteps.indexOf(currentStep);
  const completionPercent = Math.max(
    14,
    Math.round(((currentIndex + 1) / orderedSteps.length) * 100),
  );

  return {
    currentStep,
    completedSteps,
    nextStep,
    nextStepRoute:
      nextStep === "awaiting_signature" && nextUnsignedContract
        ? `/dashboard/contracts?document=${nextUnsignedContract.key}`
        : stepMeta[nextStep].route,
    completionPercent,
    currentStepNumber: currentIndex + 1,
    totalSteps: orderedSteps.length,
    currentStepLabel: stepMeta[currentStep].label,
    nextActionLabel:
      nextStep === "awaiting_signature" && nextUnsignedContract
        ? `Review and sign ${nextUnsignedContract.label}`
        : stepMeta[nextStep].action,
  };
}

export function getResumeRoute(lead: Lead) {
  return deriveClientProgress(lead).nextStepRoute;
}

const intakeStepMeta: Record<
  IntakeStepKey,
  { label: string; action: string; number: number }
> = {
  basic_contact: {
    label: "Basic contact details",
    action: "Start your intake details",
    number: 1,
  },
  credit_goals: {
    label: "Credit goals and situation",
    action: "Add your credit goals and current situation",
    number: 2,
  },
  report_readiness: {
    label: "Credit report readiness",
    action: "Confirm whether all 3 bureau reports are ready",
    number: 3,
  },
  document_upload: {
    label: "Document and report upload",
    action: "Upload the next missing required document",
    number: 4,
  },
  review_and_continue: {
    label: "Review and continue",
    action: "Review your intake and continue forward",
    number: 5,
  },
};

export function deriveIntakeWorkflowProgress(lead?: Lead): IntakeWorkflowProgress {
  if (!lead) {
    return {
      currentStepNumber: 1,
      totalSteps: 5,
      currentStepKey: "basic_contact",
      currentStepLabel: intakeStepMeta.basic_contact.label,
      nextActionLabel: intakeStepMeta.basic_contact.action,
    };
  }

  const counts = getDocumentCounts(lead.documents);
  const allReportsReady = hasAllBureauReports(lead.documents);
  const reviewReady = isLeadReadyForReview(lead);

  let currentStepKey: IntakeStepKey = "basic_contact";

  if (lead.intakeStatus === "not_started") {
    currentStepKey = "basic_contact";
  } else if (lead.intakeStatus === "in_progress" && lead.reportReadiness === "unknown") {
    currentStepKey = "credit_goals";
  } else if (
    lead.reportReadiness === "unknown" ||
    lead.reportReadiness === "partial" ||
    lead.reportReadiness === "not_ready"
  ) {
    currentStepKey = "report_readiness";
  } else if (counts.missing > 0 || !allReportsReady) {
    currentStepKey = "document_upload";
  } else if (reviewReady || lead.intakeStatus === "completed") {
    currentStepKey = "review_and_continue";
  }

  return {
    currentStepNumber: intakeStepMeta[currentStepKey].number,
    totalSteps: 5,
    currentStepKey,
    currentStepLabel: intakeStepMeta[currentStepKey].label,
    nextActionLabel: intakeStepMeta[currentStepKey].action,
  };
}
