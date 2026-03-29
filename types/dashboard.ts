import type {
  ContractDocument,
  DisputeRecord,
  Lead,
  MailingEventRecord,
  MailingJobRecord,
  PaymentRecord,
} from "@/lib/types";

export type DashboardActionTone = "urgent" | "active" | "complete";
export type DashboardStepStatus = "complete" | "current" | "upcoming";

export type ClientDashboardAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  tone: DashboardActionTone;
};

export type ClientJourneyStep = {
  id: string;
  label: string;
  detail: string;
  status: DashboardStepStatus;
  href: string;
};

export type ClientDisputeTimelineItem = {
  id: string;
  label: string;
  detail: string;
  status: DashboardStepStatus;
};

export type ClientDashboardBanner = {
  id: string;
  tone: "info" | "success" | "warning";
  text: string;
  href?: string;
  hrefLabel?: string;
};

export type ClientDashboardViewModel = {
  lead: Lead;
  leadFirstName: string;
  disclaimers: string[];
  banners: ClientDashboardBanner[];
  progressPercent: number;
  stepNumber: number;
  totalSteps: number;
  currentStepTitle: string;
  currentStepSummary: string;
  nextStepHref: string;
  nextStepLabel: string;
  statusBarLabel: string;
  statusProblem: string;
  primaryAction: ClientDashboardAction;
  journeySteps: ClientJourneyStep[];
  documentSummary: {
    uploaded: number;
    total: number;
    readyLabel: string;
    missingLabels: string[];
    blockerReasons?: string[];
  };
  disputeTimeline: ClientDisputeTimelineItem[];
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
  supportFaqs: string[];
  trustNotes: string[];
  showPaymentCard: boolean;
  showMailingCard: boolean;
  paymentActionHref?: string;
  paymentActionLabel?: string;
  contractPacketOpen: boolean;
  contractDocuments: ContractDocument[];
  dispute: DisputeRecord | null;
  payment: PaymentRecord | null;
  mailingJob: MailingJobRecord | null;
  events: MailingEventRecord[];
};
