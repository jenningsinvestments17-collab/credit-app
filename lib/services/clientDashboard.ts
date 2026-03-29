import { getContractCounts, getNextUnsignedContract } from "@/lib/contracts";
import { getDocumentCounts, getLeadStatusBarModel } from "@/lib/leads";
import {
  mailingProviderStatusLabels,
  mailingStatusLabels,
  paymentStatusLabels,
} from "@/lib/ui/statusLabels";
import { deriveClientProgress } from "@/lib/progress";
import type {
  DisputeRecord,
  Lead,
  MailingEventRecord,
  MailingJobRecord,
  PaymentRecord,
} from "@/lib/types";

export type ClientDashboardAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  tone: "urgent" | "active" | "complete";
};

export type ClientDashboardTimelineItem = {
  id: string;
  label: string;
  detail: string;
  status: "complete" | "current" | "upcoming";
};

export type ClientJourneyStep = {
  id: string;
  label: string;
  detail: string;
  status: "complete" | "current" | "upcoming";
  href: string;
};

export type ClientDashboardModel = {
  progressPercent: number;
  stepNumber: number;
  totalSteps: number;
  currentStepTitle: string;
  currentStepSummary: string;
  nextStepHref: string;
  nextStepLabel: string;
  statusBarLabel: string;
  statusProblem: string;
  documentSummary: {
    uploaded: number;
    total: number;
    readyLabel: string;
    missingLabels: string[];
  };
  paymentSummary: {
    statusLabel: string;
    note: string;
    amountLabel: string;
  };
  mailingSummary: {
    workflowLabel: string;
    providerLabel: string;
    trackingLabel: string;
    note: string;
  };
  primaryAction: ClientDashboardAction;
  requiredActions: ClientDashboardAction[];
  journeySteps: ClientJourneyStep[];
  disputeTimeline: ClientDashboardTimelineItem[];
  trustNotes: string[];
  supportFaqs: string[];
  contractCounts: ReturnType<typeof getContractCounts>;
  nextUnsignedContract: ReturnType<typeof getNextUnsignedContract>;
  showPaymentCard: boolean;
  showMailingCard: boolean;
};

function buildRequiredActions(
  lead: Lead,
  dispute: DisputeRecord | null,
  payment: PaymentRecord | null,
  mailingJob: MailingJobRecord | null,
): ClientDashboardAction[] {
  const actions: ClientDashboardAction[] = [];
  const missingDocuments = lead.documents.filter((document) => document.status === "missing");
  const nextUnsignedContract = getNextUnsignedContract(lead.contractDocuments);

  if (lead.intakeStatus !== "completed") {
    actions.push({
      id: "continue-intake",
      title: "Continue your intake",
      description: "Pick up where you left off so your file keeps moving toward review.",
      href: "/intake#intake-form",
      ctaLabel: "Resume Intake",
      tone: "active",
    });
  }

  if (missingDocuments.length > 0) {
    actions.push({
      id: "upload-documents",
      title: "Upload the remaining required documents",
      description: `Your file still needs ${missingDocuments.length} required item${missingDocuments.length === 1 ? "" : "s"} before AI review can start.`,
      href: "/intake#document-upload",
      ctaLabel: "Open Upload Center",
      tone: "urgent",
    });
  }

  if (nextUnsignedContract) {
    actions.push({
      id: "sign-contracts",
      title: "Finish the onboarding packet",
      description: `Your next signature is ${nextUnsignedContract.label.toLowerCase()}.`,
      href: `/dashboard/contracts?document=${nextUnsignedContract.key}`,
      ctaLabel: "Review and Sign",
      tone: "active",
    });
  }

  if (
    dispute &&
    payment &&
    (payment.status === "payment_required" ||
      payment.status === "authorization_expired" ||
      payment.status === "payment_failed" ||
      payment.status === "payment_not_collected")
  ) {
    actions.push({
      id: "secure-payment",
      title: "Secure the $405 mailing authorization",
      description:
        "Your final dispute cannot move into certified mailing until the payment method is valid again.",
      href: "/dashboard",
      ctaLabel: "Review Payment",
      tone: "urgent",
    });
  }

  if (mailingJob && mailingJob.trackingNumber) {
    actions.push({
      id: "watch-tracking",
      title: "Watch your mailing progress",
      description: `Tracking ${mailingJob.trackingNumber} is now attached to your dispute mailing workflow.`,
      href: "/dashboard",
      ctaLabel: "View Tracking",
      tone: "complete",
    });
  }

  if (!actions.length) {
    actions.push({
      id: "stay-ready",
      title: "Your file is moving cleanly",
      description:
        "Nothing urgent is blocking the case right now. Keep the portal handy for the next update.",
      href: "/dashboard",
      ctaLabel: "Stay In Portal",
      tone: "complete",
    });
  }

  return actions;
}

function buildTimeline(
  lead: Lead,
  dispute: DisputeRecord | null,
  payment: PaymentRecord | null,
  mailingJob: MailingJobRecord | null,
  events: MailingEventRecord[],
): ClientDashboardTimelineItem[] {
  const generated =
    lead.aiReviewStatus === "draft_generated" ||
    lead.aiReviewStatus === "awaiting_admin_review" ||
    Boolean(dispute);
  const adminReviewed =
    lead.aiReviewStatus === "approved" ||
    Boolean(events.find((event) => event.eventType === "approved"));
  const paymentReady = Boolean(
    payment &&
      (payment.status === "authorized" ||
        payment.status === "ready_to_capture" ||
        payment.status === "captured"),
  );
  const mailed = Boolean(mailingJob && mailingJob.providerStatus !== "not_submitted");
  const delivered = Boolean(mailingJob && mailingJob.deliveryStatus === "delivered");

  return [
    {
      id: "file-organized",
      label: "File organized",
      detail:
        lead.documentCollectionStatus === "complete" ||
        lead.documentCollectionStatus === "under_review"
          ? "Required reports and supporting documents are in the file."
          : "Your file is still collecting required reports and identity documents.",
      status:
        lead.documentCollectionStatus === "complete" ||
        lead.documentCollectionStatus === "under_review"
          ? "complete"
          : "current",
    },
    {
      id: "draft-generated",
      label: "AI dispute prepared",
      detail: generated
        ? "The dispute draft has been generated from the verified file."
        : "AI drafting will start once all required uploads are in and review-ready.",
      status: generated ? "complete" : "upcoming",
    },
    {
      id: "admin-review",
      label: "Admin review",
      detail: adminReviewed
        ? "Your dispute has been reviewed and approved for the final service workflow."
        : "The draft is waiting on final admin review and any edits needed before approval.",
      status: adminReviewed ? "complete" : generated ? "current" : "upcoming",
    },
    {
      id: "payment-secured",
      label: "Payment secured after service",
      detail: paymentReady
        ? "Your payment method is secured for the final mailing release."
        : "No upfront fee is collected. Payment is only secured once the service is ready for final mailing.",
      status: paymentReady ? "complete" : adminReviewed ? "current" : "upcoming",
    },
    {
      id: "certified-mail",
      label: "Certified mail sent",
      detail: delivered
        ? "The provider marked the mailing as delivered."
        : mailed
          ? `Your dispute is in the certified-mail workflow${mailingJob?.trackingNumber ? ` with tracking ${mailingJob.trackingNumber}` : ""}.`
          : "Certified mail will only release after approval, final PDF generation, and payment validation.",
      status: delivered ? "complete" : mailed ? "current" : "upcoming",
    },
  ];
}

function buildJourneySteps(
  lead: Lead,
  dispute: DisputeRecord | null,
  payment: PaymentRecord | null,
  mailingJob: MailingJobRecord | null,
): ClientJourneyStep[] {
  const docsReady =
    lead.documentCollectionStatus === "complete" ||
    lead.documentCollectionStatus === "under_review";
  const aiReady =
    lead.aiReviewStatus === "ready_for_ai" ||
    lead.aiReviewStatus === "ai_in_progress" ||
    lead.aiReviewStatus === "draft_generated" ||
    lead.aiReviewStatus === "awaiting_admin_review" ||
    lead.aiReviewStatus === "approved";
  const approved =
    lead.aiReviewStatus === "approved" ||
    dispute?.workflowStatus === "approved_pending_pdf" ||
    dispute?.workflowStatus === "awaiting_payment" ||
    dispute?.workflowStatus === "paid_ready_to_send" ||
    dispute?.workflowStatus === "queued_for_send" ||
    dispute?.workflowStatus === "sent_to_provider" ||
    dispute?.workflowStatus === "tracking_received" ||
    dispute?.workflowStatus === "delivered";
  const paymentReady = Boolean(
    payment &&
      ["authorized", "ready_to_capture", "captured"].includes(payment.status),
  );
  const mailed = Boolean(
    mailingJob &&
      ["submitted", "accepted", "tracking_received"].includes(mailingJob.providerStatus),
  );

  return [
    {
      id: "intake",
      label: "Intake",
      detail:
        lead.intakeStatus === "completed"
          ? "Your intake is locked in and the file can move to uploads."
          : "Start or resume intake so your file can move forward.",
      status: lead.intakeStatus === "completed" ? "complete" : "current",
      href: "/intake#intake-form",
    },
    {
      id: "documents",
      label: "Docs",
      detail: docsReady
        ? "Required reports and identity documents are in the file."
        : "Upload every required bureau report, ID, and proof of address.",
      status: docsReady ? "complete" : lead.intakeStatus === "completed" ? "current" : "upcoming",
      href: "/intake#document-upload",
    },
    {
      id: "ai",
      label: "AI",
      detail: aiReady
        ? "Your file is in the AI dispute workflow."
        : "AI only starts after the required uploads are complete.",
      status: aiReady ? "complete" : docsReady ? "current" : "upcoming",
      href: "/dashboard",
    },
    {
      id: "approved",
      label: "Approved",
      detail: approved
        ? "Admin review and dispute approval are complete."
        : "Your draft will move here after AI generation and review.",
      status: approved ? "complete" : aiReady ? "current" : "upcoming",
      href: "/dashboard",
    },
    {
      id: "paid",
      label: "Paid",
      detail: paymentReady
        ? "Your post-service payment is secured."
        : "No upfront fee. Payment only opens after service reaches final release.",
      status: paymentReady ? "complete" : approved ? "current" : "upcoming",
      href: "/dashboard",
    },
    {
      id: "mailed",
      label: "Mailed",
      detail: mailed
        ? "Your dispute is now moving through certified mail."
        : "Mailing releases after approval, final PDF, and payment validation.",
      status: mailed ? "complete" : paymentReady ? "current" : "upcoming",
      href: "/dashboard",
    },
  ];
}

export function buildClientDashboardModel(input: {
  lead: Lead;
  dispute: DisputeRecord | null;
  payment: PaymentRecord | null;
  mailingJob: MailingJobRecord | null;
  events?: MailingEventRecord[];
}): ClientDashboardModel {
  const { lead, dispute, payment, mailingJob, events = [] } = input;
  const progress = deriveClientProgress(lead);
  const statusBar = getLeadStatusBarModel(lead);
  const documentCounts = getDocumentCounts(lead.documents);
  const missingLabels = lead.documents
    .filter((document) => document.status === "missing")
    .map((document) => document.label);
  const contractCounts = getContractCounts(lead.contractDocuments);
  const nextUnsignedContract = getNextUnsignedContract(lead.contractDocuments);
  const requiredActions = buildRequiredActions(lead, dispute, payment, mailingJob);
  const journeySteps = buildJourneySteps(lead, dispute, payment, mailingJob);
  const showPaymentCard = Boolean(
    dispute &&
      payment &&
      [
        "payment_required",
        "authorization_expired",
        "payment_failed",
        "payment_not_collected",
        "authorized",
        "ready_to_capture",
        "captured",
      ].includes(payment.status),
  );
  const showMailingCard = Boolean(dispute && mailingJob);

  return {
    progressPercent: progress.completionPercent,
    stepNumber: progress.currentStepNumber,
    totalSteps: progress.totalSteps,
    currentStepTitle: progress.currentStepLabel,
    currentStepSummary:
      "The portal keeps your file organized around the current stage, the next required move, and what is still blocking final review.",
    nextStepHref: progress.nextStepRoute,
    nextStepLabel: progress.nextActionLabel,
    statusBarLabel: statusBar.stepLabel,
    statusProblem: statusBar.problem,
    documentSummary: {
      uploaded: documentCounts.uploaded,
      total: documentCounts.total,
      readyLabel:
        lead.documentCollectionStatus === "complete"
          ? "All required documents accepted"
          : lead.documentCollectionStatus === "under_review"
            ? "Documents under review"
            : lead.reportReadiness === "ready"
              ? "Reports ready"
              : "Uploads still needed",
      missingLabels,
    },
    paymentSummary: {
      statusLabel: payment ? paymentStatusLabels[payment.status] : "Not requested yet",
      note: payment
        ? payment.status === "captured" ||
          payment.status === "authorized" ||
          payment.status === "ready_to_capture"
          ? "Your payment method is secured only after service reaches the final release point."
          : "No upfront fee is charged. Payment only becomes active after your dispute is reviewed and ready for mailing."
        : "No upfront fee. The mailing payment only appears after the dispute is approved and the final PDF is prepared.",
      amountLabel: "$405 service release",
    },
    mailingSummary: {
      workflowLabel: dispute ? mailingStatusLabels[dispute.workflowStatus] : "Not in mailing yet",
      providerLabel: mailingJob
        ? mailingProviderStatusLabels[mailingJob.providerStatus]
        : "Provider not started",
      trackingLabel: mailingJob?.trackingNumber ?? "Tracking not issued yet",
      note: mailingJob?.trackingNumber
        ? "Tracking is now attached to your file and will update here as the mailing moves."
        : "The portal will show provider submission and tracking here once the final dispute enters certified mail.",
    },
    primaryAction: requiredActions[0],
    requiredActions,
    journeySteps,
    disputeTimeline: buildTimeline(lead, dispute, payment, mailingJob, events),
    trustNotes: [
      "No upfront service fee. Payment only appears after the work reaches the final release point.",
      "Uploads, review, contracts, payment, and mailing stay connected inside one portal.",
      "Every return visit sends you back to the right step instead of restarting your file.",
    ],
    supportFaqs: [
      "You do not pay the $405 service release upfront. It only appears after the dispute is approved and ready for final mailing.",
      "AI drafting does not start until the required bureau reports and supporting documents are in the file.",
      "If a payment method fails, mailing stays paused until you update the card through the secure portal link.",
    ],
    contractCounts,
    nextUnsignedContract,
    showPaymentCard,
    showMailingCard,
  };
}
