import { getNextUnsignedContract } from "@/lib/contracts";
import { getDocumentCounts, getLeadStatusBarModel } from "@/lib/leads";
import { deriveClientProgress } from "@/lib/progress";
import { getRequiredDocumentState } from "@/lib/services/documentService";
import { getAiWorkflowStateForLead } from "@/lib/services/disputeService";
import { shouldShowPaymentCta } from "@/lib/workflows/paymentWorkflow";
import {
  mailingProviderStatusLabels,
  mailingStatusLabels,
  paymentStatusLabels,
} from "@/lib/ui/statusLabels";
import type {
  DisputeRecord,
  Lead,
  MailingEventRecord,
  MailingJobRecord,
  PaymentRecord,
} from "@/lib/types";
import type {
  ClientDashboardAction,
  ClientDashboardViewModel,
  ClientDisputeTimelineItem,
  ClientJourneyStep,
} from "@/types/dashboard";

export function buildClientRequiredActions(
  lead: Lead,
  dispute: DisputeRecord | null,
  payment: PaymentRecord | null,
  mailingJob: MailingJobRecord | null,
): ClientDashboardAction[] {
  const actions: ClientDashboardAction[] = [];
  const documentState = getRequiredDocumentState(lead);
  const nextUnsignedContract = getNextUnsignedContract(lead.contractDocuments);
  const paymentEligible = Boolean(dispute?.approvedAt && dispute?.serviceRenderedAt);

  if (lead.intakeStatus !== "completed") {
    actions.push({
      id: "continue-intake",
      title: "Continue your intake",
      description: "Pick up where you left off so your file keeps moving toward review.",
      href: "/intake",
      ctaLabel: "Resume Intake",
      tone: "active",
    });
  }

  if (!documentState.allUploaded || !documentState.allValidated) {
    actions.push({
      id: "upload-documents",
      title: !documentState.allUploaded
        ? "Upload the remaining required documents"
        : "Wait for document verification",
      description: !documentState.allUploaded
        ? `Your file still needs ${documentState.missingDocuments.length} required item${documentState.missingDocuments.length === 1 ? "" : "s"} before AI review can start.`
        : "All required files are uploaded, but the file still has to clear verification before AI processing can begin.",
      href: "/intake/documents",
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

  if (dispute && shouldShowPaymentCta(payment, paymentEligible)) {
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

  if (mailingJob?.trackingNumber) {
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

export function buildClientJourneySteps(
  lead: Lead,
  dispute: DisputeRecord | null,
  payment: PaymentRecord | null,
  mailingJob: MailingJobRecord | null,
): ClientJourneyStep[] {
  const documentState = getRequiredDocumentState(lead);
  const aiState = getAiWorkflowStateForLead(lead);
  const docsReady = documentState.allValidated;
  const aiStarted = Boolean(
    dispute &&
      [
        "queued_for_ai",
        "ai_in_progress",
        "ai_generated",
        "awaiting_admin_review",
        "approved",
        "service_rendered",
        "queued_for_mailing",
        "mailed",
      ].includes(dispute.processingStatus),
  );
  const approved = Boolean(dispute?.approvedAt);
  const paymentReady = Boolean(payment && ["authorized", "ready_to_capture", "captured"].includes(payment.status));
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
      href: "/intake",
    },
    {
      id: "documents",
      label: "Docs",
      detail: docsReady
        ? "Required reports and supporting documents are in the file."
        : "Upload every required bureau report, ID, and proof of address.",
      status: docsReady ? "complete" : lead.intakeStatus === "completed" ? "current" : "upcoming",
      href: "/intake/documents",
    },
    {
      id: "ai",
      label: "AI",
      detail: aiStarted
        ? "Your file is in the AI dispute workflow."
        : aiState.eligibleForProcessing
          ? "Your file is eligible and waiting to be queued for AI processing."
          : "AI only starts after the required uploads are complete and reports are ready.",
      status: aiStarted ? "complete" : aiState.eligibleForProcessing ? "current" : "upcoming",
      href: "/dashboard",
    },
    {
      id: "approved",
      label: "Approved",
      detail: approved
        ? "Admin review and dispute approval are complete."
        : "Your draft will move here after AI generation and review.",
      status: approved ? "complete" : aiStarted ? "current" : "upcoming",
      href: "/dashboard",
    },
    {
      id: "paid",
      label: "Paid",
      detail: paymentReady
        ? "Your post-service payment is secured."
        : "No upfront fee. Payment only opens after service is rendered and approved.",
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

export function buildClientDisputeTimeline(
  lead: Lead,
  dispute: DisputeRecord | null,
  payment: PaymentRecord | null,
  mailingJob: MailingJobRecord | null,
  events: MailingEventRecord[],
): ClientDisputeTimelineItem[] {
  const documentState = getRequiredDocumentState(lead);
  const generated = Boolean(
    dispute &&
      ["ai_generated", "awaiting_admin_review", "approved", "service_rendered", "queued_for_mailing", "mailed"].includes(
        dispute.processingStatus,
      ),
  );
  const adminReviewed = Boolean(dispute?.approvedAt || events.find((event) => event.eventType === "approved"));
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
      detail: documentState.allValidated
        ? "Required reports and supporting documents are in the file."
        : "Your file is still collecting or validating required reports and identity documents.",
      status: documentState.allValidated ? "complete" : "current",
    },
    {
      id: "draft-generated",
      label: "AI dispute prepared",
      detail: generated
        ? "The dispute draft has been generated from the verified file."
        : "AI drafting will start once all required uploads are validated and bureau reports are ready.",
      status: generated ? "complete" : documentState.allValidated ? "current" : "upcoming",
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
        : "No upfront fee is collected. Payment only becomes active after service is rendered and the final dispute is ready for release.",
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

export function buildClientDashboardState(input: {
  lead: Lead;
  dispute: DisputeRecord | null;
  payment: PaymentRecord | null;
  mailingJob: MailingJobRecord | null;
  events: MailingEventRecord[];
}) {
  const { lead, dispute, payment, mailingJob, events } = input;
  const progress = deriveClientProgress(lead);
  const statusBar = getLeadStatusBarModel(lead);
  const documentCounts = getDocumentCounts(lead.documents);
  const documentState = getRequiredDocumentState(lead);
  const aiState = getAiWorkflowStateForLead(lead);
  const missingLabels = documentState.missingDocuments.map((document) => document.label);
  const requiredActions = buildClientRequiredActions(lead, dispute, payment, mailingJob);
  const journeySteps = buildClientJourneySteps(lead, dispute, payment, mailingJob);
  const disputeTimeline = buildClientDisputeTimeline(
    lead,
    dispute,
    payment,
    mailingJob,
    events,
  );
  const showPaymentCard = Boolean(
    dispute && shouldShowPaymentCta(payment, Boolean(dispute.serviceRenderedAt && dispute.approvedAt)),
  );
  const showMailingCard = Boolean(dispute && mailingJob);
  const paymentActionHref = payment?.updatePaymentMethodUrl ?? payment?.checkoutUrl;
  const paymentActionLabel =
    payment?.status === "payment_failed" || payment?.status === "authorization_expired"
      ? "Update Card"
      : "Pay Now";

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
    primaryAction: requiredActions[0],
    journeySteps,
    documentSummary: {
      uploaded: documentCounts.uploaded,
      total: documentCounts.total,
      readyLabel: documentState.allValidated
        ? "All required documents accepted"
        : documentState.allUploaded
          ? "Documents under review"
          : aiState.reportState.allUploaded
            ? "Reports ready"
            : "Uploads still needed",
      missingLabels,
      blockerReasons: aiState.blockedReasons,
    },
    disputeTimeline,
    paymentSummary: {
      statusLabel: payment ? paymentStatusLabels[payment.status] : "Not eligible yet",
      note: payment
        ? payment.status === "captured" ||
          payment.status === "authorized" ||
          payment.status === "ready_to_capture"
          ? "Your payment method is secured only after service reaches the final release point."
          : "No upfront fee is charged. Payment only becomes active after your dispute is approved and service is rendered."
        : "No upfront fee. The mailing payment only appears after the dispute is approved, service is rendered, and the final PDF is prepared.",
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
    supportFaqs: [
      "You do not pay the $405 service release upfront. It only appears after the dispute is approved, service is rendered, and ready for mailing.",
      "AI drafting does not start until the required bureau reports and supporting documents are uploaded, validated, and parse-ready.",
      "If a payment method fails, mailing stays paused until you update the card through the secure portal link.",
    ],
    trustNotes: [
      "No upfront service fee. Payment only appears after the work reaches the final release point.",
      "Uploads, review, contracts, payment, and mailing stay connected inside one portal.",
      "Every return visit sends you back to the right step instead of restarting your file.",
    ],
    showPaymentCard,
    showMailingCard,
    paymentActionHref,
    paymentActionLabel,
  } satisfies Omit<
    ClientDashboardViewModel,
    | "lead"
    | "leadFirstName"
    | "disclaimers"
    | "banners"
    | "contractPacketOpen"
    | "contractDocuments"
    | "dispute"
    | "payment"
    | "mailingJob"
    | "events"
  >;
}
