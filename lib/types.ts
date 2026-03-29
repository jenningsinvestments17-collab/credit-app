import type { DomainEventName } from "@/lib/events/eventNames";
import type {
  BookingStatusValue,
  CanonicalContractStatus,
  CanonicalDisputeStatus,
  CanonicalDocumentStatus,
  CanonicalIntakeStepStatus,
  CanonicalLeadStatus,
  CanonicalMailingStatus,
  CertifiedMailQueueStatusValue,
  ConsultationStatusValue,
  IntakeStatusValue,
  MailingDeliveryStatusValue,
  MailingProviderStatusValue,
  PaymentStatusValue,
  ReportReadinessStatusValue,
} from "@/lib/statuses";

export type LeadStatus = CanonicalLeadStatus;
export type DocumentStatus = CanonicalDocumentStatus;
export type DisputeStatus = CanonicalDisputeStatus;
export type ContractStatus = CanonicalContractStatus;
export type AdminRole = "admin" | "super_admin";

export type BookingStatus = BookingStatusValue;
export type IntakeStatus = IntakeStatusValue;
export type ConsultationStatus = ConsultationStatusValue;
export type ReportReadinessStatus = ReportReadinessStatusValue;
export type DocumentCollectionStatus =
  | "missing"
  | "partially_uploaded"
  | "under_review"
  | "complete";
export type AIReviewStatus = CanonicalDisputeStatus;
export type MailTemplateType =
  | "booking_confirmation"
  | "intake_reminder"
  | "missing_documents"
  | "next_step_guidance"
  | "contracts_sent"
  | "contracts_signed"
  | "new_lead_alert"
  | "intake_completed"
  | "documents_uploaded"
  | "ready_for_ai_review";
export type MailAudience = "client" | "admin";
export type MailJobStatus = "pending" | "sent" | "failed";
export type NotificationAudience = "client" | "admin";
export type NotificationChannel = "email" | "sms";
export type NotificationJobStatus = "pending" | "processing" | "sent" | "failed";
export type NotificationTemplateType =
  | "account_created"
  | "intake_incomplete"
  | "documents_missing"
  | "ai_draft_ready"
  | "payment_required"
  | "payment_success"
  | "mail_sent"
  | "admin_follow_up"
  | "admin_account_created"
  | "admin_documents_uploaded"
  | "admin_ai_draft_ready"
  | "admin_payment_required"
  | "admin_payment_success"
  | "admin_mail_sent";
export type MailingWorkflowStatus = CanonicalMailingStatus;
export type MailingProviderStatus = MailingProviderStatusValue;
export type PaymentStatus = PaymentStatusValue;
export type DisputeVersionKind =
  | "ai_draft"
  | "admin_rejected"
  | "admin_approved"
  | "service_rendered"
  | "mailing_final";
export type ContractPacketStatus = CanonicalContractStatus;
export type ContractDocumentKey =
  | "service_agreement"
  | "consumer_rights_disclosure"
  | "cancellation_form"
  | "authorization_release_information"
  | "authorization_submit_disputes"
  | "consumer_directed_dispute_authorization"
  | "consumer_file_request_form";
export type ContractDocumentStatus = CanonicalContractStatus;
export type PortalStep =
  | "account_created"
  | "profile_started"
  | "credit_goals_completed"
  | "report_readiness_completed"
  | "documents_partially_uploaded"
  | "all_required_docs_uploaded"
  | "ready_for_review"
  | "contracts_sent"
  | "awaiting_signature"
  | "fully_signed";
export type RequiredDocumentKey =
  | "valid_id"
  | "proof_of_address"
  | "experian_report"
  | "equifax_report"
  | "transunion_report";
export type RequiredDocumentStatus = CanonicalDocumentStatus;
export type Bureau = "Experian" | "Equifax" | "TransUnion";
export type DisputeWorkflowStatus = CanonicalDisputeStatus;
export type CertifiedMailQueueStatus = CertifiedMailQueueStatusValue;
export type DefectCode =
  | "inconsistent_balance"
  | "inconsistent_payment_history"
  | "inconsistent_status"
  | "dispute_not_marked"
  | "obsolete_debt"
  | "suspected_re_aging"
  | "duplicate_tradeline"
  | "amount_misrepresented"
  | "status_misrepresented"
  | "unexplained_fee_increase"
  | "unverifiable_account_data"
  | "transfer_sale_double_reporting"
  | "mixed_file_issue"
  | "inconsistent_delinquency_activity_dates";
export type DefectCategory =
  | "balance"
  | "payment_history"
  | "status"
  | "dispute_reporting"
  | "obsolescence"
  | "re_aging"
  | "duplication"
  | "amount"
  | "fees"
  | "verification"
  | "mixed_file"
  | "date_integrity";
export type DefectSeverity = "low" | "medium" | "high" | "critical";
export type DefectTone = "factual" | "firm" | "aggressive" | "legal_leverage";
export type DefectStrategyLevel = "low" | "medium" | "high";
export type DefectOutputTemplateKey =
  | "balance_inconsistency"
  | "payment_history_inconsistency"
  | "status_inconsistency"
  | "dispute_notation_missing"
  | "obsolete_debt"
  | "re_aging"
  | "duplicate_reporting"
  | "amount_misrepresented"
  | "fee_increase"
  | "unverifiable_data"
  | "mixed_file"
  | "date_inconsistency";
export type CaseStrengthClassification = "low" | "medium" | "high";
export type EscalationTier =
  | "basic"
  | "aggressive"
  | "legal_leverage"
  | "litigation_candidate";
export type EscalationStage =
  | "initial_dispute"
  | "reinforcement_dispute"
  | "formal_escalation_notice"
  | "claim_preparation"
  | "external_action";

export type RequiredDocument = {
  key: RequiredDocumentKey;
  label: string;
  helperText: string;
  status: RequiredDocumentStatus;
};

export type ContractDocument = {
  key: ContractDocumentKey;
  label: string;
  description: string;
  required: boolean;
  status: ContractDocumentStatus;
  sentAt?: string;
  signedAt?: string;
  version: string;
};

export type ReportSource = {
  bureau: Bureau;
  documentKey: RequiredDocumentKey;
  uploaded: boolean;
  originalFilename?: string;
  storagePath?: string;
  parseStatus?: "pending" | "processing" | "parsed" | "failed" | "reviewed";
  extractionStrategy?: "native_text" | "ocr" | "none";
  scannedLikely?: boolean;
  parseError?: string;
  extractedText?: string;
  normalizedSummary?: string;
  parsedTradelines?: TradelineReviewInput[];
};

export type TradelineReviewInput = {
  bureau?: Bureau;
  furnisher?: string;
  accountName?: string;
  accountNumberMask?: string;
  balance?: string;
  status?: string;
  remarks?: string;
  paymentStatus?: string;
  pastDue?: string;
  disputeComments?: string;
  dateOpened?: string;
  rawData?: Record<string, unknown>;
};

export type DefectFinding = {
  accountKey: string;
  bureau: Bureau;
  accountName: string;
  accountLast4: string;
  defectCode: DefectCode;
  title: string;
  category: DefectCategory;
  severity: DefectSeverity;
  laws: string[];
  reason: string;
  consumerHarm: string;
  disputeGoal: string;
  suggestedTone: DefectTone;
  strategyLevel: DefectStrategyLevel;
  outputTemplateKey: DefectOutputTemplateKey;
  escalationReady: boolean;
  confidence: number;
  score: number;
  supportingFacts: string[];
  disputeCodes?: string[];
  tradelineData?: TradelineReviewInput;
};

export type ScoredDefectFinding = DefectFinding & {
  severityPoints: number;
  confidenceMultiplier: number;
  evidenceBonus: number;
  totalScore: number;
};

export type EscalationFlagType =
  | "combo_dispute_and_inaccuracy"
  | "repeat_violation_across_versions"
  | "post_dispute_failure"
  | "multi_bureau_inconsistency"
  | "critical_obsolescence"
  | "mixed_file_risk"
  | "multi_high_severity_combination";

export type EscalationFlag = {
  type: EscalationFlagType;
  title: string;
  reason: string;
  weight: number;
};

export type CaseScoreAnalysis = {
  version: number;
  totalScore: number;
  highSeverityCount: number;
  criticalCount: number;
  classification: CaseStrengthClassification;
  findings: ScoredDefectFinding[];
};

export type EscalationAnalysis = {
  tier: EscalationTier;
  tone: DefectTone;
  includeStatutes: boolean;
  escalationRecommendation: string;
  claimPreservation: boolean;
  flags: EscalationFlag[];
};

export type EscalationHistoryActorType = "system" | "admin";

export type EscalationStageTransition = {
  stage: EscalationStage;
  reason: string;
  actorType: EscalationHistoryActorType;
  actorId: string;
  occurredAt: string;
  overrideApplied?: boolean;
};

export type ClaimPacket = {
  disputeId: string;
  leadId: string;
  stage: EscalationStage;
  generatedAt: string;
  caseSummary: string;
  violationSummary: string;
  timeline: string[];
  evidenceList: string[];
  neutralLegalMapping: string[];
  requestedOutcome: string;
  escalationLetter: string;
  claimPacketText: string;
  claimPacketPdfPath?: string;
  exportBundlePath?: string;
};

export type EscalationPipelineOutput = {
  stage: EscalationStage;
  stageReason: string;
  recommendedNextStage?: EscalationStage;
  manualApprovalRequired: boolean;
  claimPacket: ClaimPacket;
};

export type DisputeStrategyOutput = {
  caseScore: CaseScoreAnalysis;
  escalation: EscalationAnalysis;
  pipeline?: EscalationPipelineOutput;
};

export type BureauRecipient = {
  bureau: Bureau;
  recipientName: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
};

export type PostalAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
};

export type DisputeDraft = {
  bureau: Bureau;
  generatedAt: string;
  status: DisputeWorkflowStatus;
  summary: string;
  letterText: string;
  findings: DefectFinding[];
  violationAnalysis: ViolationAnalysis;
  strategyOutput?: DisputeStrategyOutput;
  modelInputNotes: string[];
  reviewedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lastEditedAt?: string;
  adminReviewNotes?: string[];
};

export type DisputeRecord = {
  id: string;
  leadId: string;
  bureau: Bureau;
  currentVersionId: string;
  processingStatus: DisputeWorkflowStatus;
  workflowStatus: MailingWorkflowStatus;
  escalationStage?: EscalationStage;
  escalationUpdatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  serviceRenderedAt?: string;
  paidAt?: string;
  readyToSendAt?: string;
  sentToProviderAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DisputeVersionRecord = {
  id: string;
  disputeId: string;
  versionNumber: number;
  kind: DisputeVersionKind;
  letterText: string;
  summary: string;
  findings: DefectFinding[];
  strategyOutput?: DisputeStrategyOutput;
  generatedBy: "ai" | "admin" | "system";
  createdAt: string;
  approvedAt?: string;
  pdfAssetPath?: string;
  pdfGeneratedAt?: string;
  notes: string[];
};

export type DefectCodeCatalogRecord = {
  code: DefectCode;
  title: string;
  category: DefectCategory;
  severity: DefectSeverity;
  laws: string[];
  description: string;
  consumerHarm: string;
  disputeGoal: string;
  suggestedTone: DefectTone;
  strategyLevel: DefectStrategyLevel;
  outputTemplateKey: DefectOutputTemplateKey;
  escalationReady: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DisputeDefectFindingRecord = {
  id: string;
  disputeVersionId?: string;
  leadId: string;
  bureau: Bureau;
  accountKey: string;
  accountName: string;
  accountLast4: string;
  defectCode: DefectCode;
  confidence: number;
  score: number;
  supportingFacts: string[];
  createdAt: string;
  updatedAt: string;
};

export type DisputeScoreRecord = {
  id: string;
  disputeVersionId?: string;
  leadId: string;
  version: number;
  totalScore: number;
  highSeverityCount: number;
  criticalCount: number;
  classification: CaseStrengthClassification;
  createdAt: string;
  updatedAt: string;
};

export type EscalationFlagRecord = {
  id: string;
  disputeVersionId?: string;
  leadId: string;
  tier: EscalationTier;
  flagType: EscalationFlagType;
  title: string;
  reason: string;
  weight: number;
  claimPreservation: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EscalationHistoryRecord = {
  id: string;
  disputeId: string;
  disputeVersionId?: string;
  leadId: string;
  fromStage?: EscalationStage;
  toStage: EscalationStage;
  actorType: EscalationHistoryActorType;
  actorId: string;
  reason: string;
  overrideApplied: boolean;
  createdAt: string;
};

export type ClaimPacketRecord = {
  id: string;
  disputeId: string;
  disputeVersionId?: string;
  leadId: string;
  stage: EscalationStage;
  caseSummary: string;
  violationSummary: string;
  timeline: string[];
  evidenceList: string[];
  neutralLegalMapping: string[];
  requestedOutcome: string;
  escalationLetter: string;
  claimPacketText: string;
  claimPacketPdfPath?: string;
  exportBundlePath?: string;
  createdAt: string;
  updatedAt: string;
};

export type MailingJobRecord = {
  id: string;
  disputeId: string;
  leadId: string;
  bureau: Bureau;
  workflowStatus: MailingWorkflowStatus;
  providerStatus: MailingProviderStatus;
  providerName?: "lob" | "click2mail";
  providerJobId?: string;
  finalPdfPath?: string;
  recipientAddress?: BureauRecipient;
  senderAddress?: PostalAddress;
  queuedAt?: string;
  sentToProviderAt?: string;
  mailedAt?: string;
  trackingNumber?: string;
  proofOfMailingPath?: string;
  signedReturnReceiptStatus?: "pending" | "received" | "failed";
  signedReturnReceiptPath?: string;
  signedReturnReceiptReceivedAt?: string;
  signedReturnReceiptSigner?: string;
  deliveryStatus: MailingDeliveryStatusValue;
  deliveredAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type MailingEventRecord = {
  id: string;
  disputeId: string;
  mailingJobId?: string;
  eventType:
    | "ai_queued"
    | "ai_processing"
    | "ai_generated"
    | "rejected"
    | "regenerated"
    | "approved"
    | "service_rendered"
    | "pdf_generated"
    | "payment_requested"
    | "payment_confirmed"
    | "queued"
    | "sent_to_provider"
    | "tracking_received"
    | "delivered"
    | "failed";
  occurredAt: string;
  actor: string;
  notes?: string;
  metadata?: Record<string, string>;
};

export type PaymentRecord = {
  id: string;
  disputeId: string;
  leadId: string;
  amountCents: number;
  currency: "usd";
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  checkoutUrl?: string;
  updatePaymentMethodUrl?: string;
  paymentMethodLast4?: string;
  authorizedAt?: string;
  authorizationExpiresAt?: string;
  capturedAt?: string;
  requestedAt: string;
  confirmedAt?: string;
  failedAt?: string;
  retryCount?: number;
  lastRetryAt?: string;
  lastFailureReason?: string;
  clientActionRequired?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MailingPipelineStore = {
  disputes: DisputeRecord[];
  disputeVersions: DisputeVersionRecord[];
  mailingJobs: MailingJobRecord[];
  mailingEvents: MailingEventRecord[];
  paymentRecords: PaymentRecord[];
  domainEvents: DomainEvent[];
  eventProcessingLog: EventProcessingLogRecord[];
};

export type DomainEventType = DomainEventName;

export type DomainAggregateType =
  | "lead"
  | "booking"
  | "intake"
  | "document"
  | "dispute"
  | "mailing_job"
  | "payment"
  | "contract_packet"
  | "portal_progress";

export type DomainActorType = "system" | "admin" | "client" | "webhook" | "provider";

export type DomainEvent = {
  id: string;
  type: DomainEventType;
  aggregateType: DomainAggregateType;
  aggregateId: string;
  occurredAt: string;
  actorType: DomainActorType;
  actorId: string;
  payload: Record<string, unknown>;
  metadata: Record<string, string>;
};

export type EventProcessingLogRecord = {
  id: string;
  eventId: string;
  handlerName: string;
  status: "processed" | "failed" | "skipped";
  processedAt: string;
  notes?: string;
};

export type CertifiedMailPacket = {
  id: string;
  leadId: string;
  disputeBureau: Bureau;
  recipient: BureauRecipient;
  approvedAt: string;
  approvedBy: string;
  letterText: string;
  internalNotes: string[];
  queueStatus: CertifiedMailQueueStatus;
  workflowStatus: MailingWorkflowStatus;
  queuedAt?: string;
  processedAt?: string;
  mailedAt?: string;
  trackingNumber?: string;
  proofOfMailing?: string;
  signedReturnReceiptStatus?: "pending" | "received" | "failed";
  signedReturnReceiptPath?: string;
  signedReturnReceiptReceivedAt?: string;
  signedReturnReceiptSigner?: string;
  deliveryStatus: MailingDeliveryStatusValue;
  deliveredAt?: string;
  issueNote?: string;
};

export type ClientProgress = {
  currentStep: PortalStep;
  completedSteps: PortalStep[];
  nextStep: PortalStep;
  nextStepRoute: string;
  completionPercent: number;
  currentStepNumber: number;
  totalSteps: number;
  currentStepLabel: string;
  nextActionLabel: string;
};

export type IntakeWorkflowProgress = {
  currentStepNumber: number;
  totalSteps: number;
  currentStepKey: IntakeStepKey;
  currentStepLabel: string;
  nextActionLabel: string;
};

export type MailJob = {
  id: string;
  leadId?: string;
  audience: MailAudience;
  type: MailTemplateType;
  to: string;
  subject: string;
  status: MailJobStatus;
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  updatedAt: string;
  scheduledFor?: string;
  sentAt?: string;
  failedAt?: string;
  lastError?: string;
  provider?: string;
 };

export type NotificationJob = {
  id: string;
  userId?: string;
  leadId?: string;
  audience: NotificationAudience;
  channel: NotificationChannel;
  template: NotificationTemplateType;
  to: string;
  status: NotificationJobStatus;
  dedupeKey?: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  scheduledFor?: string;
  sentAt?: string;
  failedAt?: string;
  lastError?: string;
  provider?: string;
  providerMessageId?: string;
  updatedAt: string;
};

export type ViolationType =
  | "inconsistent_balance_across_bureaus"
  | "duplicate_accounts"
  | "failure_to_mark_dispute"
  | "obsolete_debt_7_years"
  | "re_aging_detection"
  | "misrepresentation_of_amount_status";

export type ViolationStrategy =
  | "basic_dispute"
  | "aggressive_dispute"
  | "dispute_with_legal_leverage";

export type ViolationRecord = {
  type: ViolationType;
  law: string;
  score: number;
  confidence: number;
  accountKey: string;
  bureau?: Bureau;
  accountName: string;
  explanation: string;
  supportingFacts: string[];
};

export type ViolationAnalysis = {
  version: number;
  overallStrength: number;
  strategy: ViolationStrategy;
  violationSummary: string;
  recommendedNextSteps: string[];
  violations: ViolationRecord[];
};

export type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  bookingStatus: BookingStatus;
  intakeStatus: IntakeStatus;
  consultationStatus: ConsultationStatus;
  leadStatus: LeadStatus;
  portalAccountCreated: boolean;
  reportReadiness: ReportReadinessStatus;
  documentCollectionStatus: DocumentCollectionStatus;
  contractPacketStatus: ContractPacketStatus;
  aiReviewStatus: AIReviewStatus;
  documents: RequiredDocument[];
  contractDocuments: ContractDocument[];
  reportSources?: ReportSource[];
  disputeDraft?: DisputeDraft;
  certifiedMailPacket?: CertifiedMailPacket;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export type ClientAccountStatus = "invited" | "active" | "disabled";
export type IntakeStepKey =
  | "basic_contact"
  | "credit_goals"
  | "report_readiness"
  | "document_upload"
  | "review_and_continue";
export type IntakeStepStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type StoredDocumentStatus =
  | "missing"
  | "uploaded"
  | "validated"
  | "rejected"
  | "needs_review"
  | "partially_uploaded"
  | "under_review"
  | "complete";
export type StoredDisputeStatus =
  | "not_ready"
  | "ready_for_ai"
  | "ai_in_progress"
  | "draft_generated"
  | "awaiting_admin_review"
  | "approved"
  | "queued_for_mailing"
  | "mailed";
export type StoredContractStatus =
  | "not_sent"
  | "sent"
  | "awaiting_signature"
  | "partially_signed"
  | "signed"
  | "completed";

export type LeadRecord = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  source?: string;
  leadStatus: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientAccountRecord = {
  id: string;
  leadId: string;
  email: string;
  passwordHash?: string;
  status: ClientAccountStatus;
  invitedAt?: string;
  activatedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BookingRecord = {
  id: string;
  leadId: string;
  bookingStatus: BookingStatus;
  consultationStatus: ConsultationStatus;
  scheduledFor?: string;
  calendlyEventUri?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type IntakeSessionRecord = {
  id: string;
  leadId: string;
  intakeStatus: IntakeStatus;
  currentStepKey?: IntakeStepKey;
  resumeRoute?: string;
  reportReadiness: ReportReadinessStatus;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type IntakeStepRecord = {
  id: string;
  intakeSessionId: string;
  stepKey: IntakeStepKey;
  stepOrder: number;
  status: IntakeStepStatus;
  completedAt?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRecord = {
  id: string;
  leadId: string;
  intakeSessionId?: string;
  key: RequiredDocumentKey;
  status: StoredDocumentStatus;
  storagePath?: string;
  mimeType?: string;
  originalFilename?: string;
  uploadedAt: string;
  reviewedAt?: string;
  validationReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type BureauReportRecord = {
  id: string;
  documentId: string;
  leadId: string;
  bureau: Bureau;
  documentKey: RequiredDocumentKey;
  originalFilename?: string;
  storagePath?: string;
  extractionStrategy?: "native_text" | "ocr" | "none";
  scannedLikely?: boolean;
  parsedText?: string;
  normalizedSummary?: string;
  parseStatus: "pending" | "processing" | "parsed" | "failed" | "reviewed";
  parsedTradelines?: TradelineReviewInput[];
  tradelineCount?: number;
  parseError?: string;
  pageCount?: number;
  adminReadyOverrideAt?: string;
  parsedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DisputeFindingRecord = {
  id: string;
  disputeVersionId: string;
  leadId?: string;
  bureau: Bureau;
  accountKey?: string;
  accountName: string;
  accountLast4?: string;
  defectCode: DefectCode;
  confidence?: number;
  score?: number;
  supportingFacts?: string[];
  reason: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type MailingProviderRecord = {
  id: string;
  mailingJobId: string;
  providerName: "lob" | "click2mail";
  providerJobId?: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  status: MailingProviderStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContractRecord = {
  id: string;
  leadId: string;
  contractKey: ContractDocumentKey;
  title: string;
  version: string;
  status: StoredContractStatus;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ContractSignatureRecord = {
  id: string;
  contractId: string;
  leadId: string;
  signerName: string;
  signerEmail: string;
  status: "pending" | "signed" | "declined";
  signedAt?: string;
  providerEnvelopeId?: string;
  auditPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminNoteRecord = {
  id: string;
  leadId: string;
  adminId?: string;
  noteType:
    | "general"
    | "review"
    | "mailing"
    | "contract"
    | "document"
    | "ai_review";
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminAccount = {
  id: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
};
