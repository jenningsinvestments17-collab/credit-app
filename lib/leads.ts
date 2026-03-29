import { buildContractDocuments } from "@/lib/contracts";
import { buildFallbackViolationAnalysis } from "@/lib/ai/violationEngine";
import { getDefectCodeDefinition } from "@/lib/ai/defectCodes";
import { getDocumentRecordsByLead } from "@/lib/db/documentState";
import { getUploadedReportRecordsByLead } from "@/lib/reports/uploadState";
import { getParsedReportRecordsByLead } from "@/lib/reports/parsedReportState";
import type {
  AIReviewStatus,
  DefectCode,
  DocumentCollectionStatus,
  Lead,
  LeadStatus,
  ReportReadinessStatus,
  RequiredDocument,
  RequiredDocumentKey,
} from "@/lib/types";

const documentBase: Record<
  RequiredDocumentKey,
  { label: string; helperText: string }
> = {
  valid_id: {
    label: "Valid ID / driver's license",
    helperText: "A clear front image of a valid government-issued ID is required.",
  },
  proof_of_address: {
    label: "Proof of address",
    helperText: "Utility bill, phone bill, or another current address proof.",
  },
  experian_report: {
    label: "Experian credit report",
    helperText: "Needed for full 3-bureau review and future AI readiness.",
  },
  equifax_report: {
    label: "Equifax credit report",
    helperText: "Needed for full 3-bureau review and admin readiness.",
  },
  transunion_report: {
    label: "TransUnion credit report",
    helperText: "Needed for full 3-bureau review and complete intake handoff.",
  },
};

function buildDocuments(
  statuses: Partial<Record<RequiredDocumentKey, RequiredDocument["status"]>>,
): RequiredDocument[] {
  return Object.entries(documentBase).map(([key, value]) => ({
    key: key as RequiredDocumentKey,
    label: value.label,
    helperText: value.helperText,
    status: statuses[key as RequiredDocumentKey] ?? "missing",
  }));
}

function buildSeedFinding(input: {
  bureau: "Experian" | "Equifax" | "TransUnion";
  accountName: string;
  accountLast4: string;
  defectCode: DefectCode;
  reason: string;
}) {
  const definition = getDefectCodeDefinition(input.defectCode);
  return {
    accountKey: `${input.accountName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}:${input.accountLast4}`,
    bureau: input.bureau,
    accountName: input.accountName,
    accountLast4: input.accountLast4,
    defectCode: input.defectCode,
    title: definition.title,
    category: definition.category,
    severity: definition.severity,
    laws: definition.laws,
    reason: input.reason,
    consumerHarm: definition.consumerHarm,
    disputeGoal: definition.disputeGoal,
    suggestedTone: definition.suggestedTone,
    strategyLevel: definition.strategyLevel,
    outputTemplateKey: definition.outputTemplateKey,
    escalationReady: definition.escalationReady,
    confidence: 0.8,
    score: 18,
    supportingFacts: [input.reason],
  };
}

function applyRuntimeLeadState(lead: Lead): Lead {
  const uploadRecords = getUploadedReportRecordsByLead(lead.id);
  const documentRecords = getDocumentRecordsByLead(lead.id);
  const parsedReports = getParsedReportRecordsByLead(lead.id);
  if (!uploadRecords.length && !documentRecords.length) {
    return lead;
  }

  const documents = lead.documents.map((document) => {
    const persisted = documentRecords.find((record) => record.key === document.key);
    const match = uploadRecords.find((record) => record.documentKey === document.key);
    if (persisted) {
      const mappedStatus =
        persisted.status === "validated"
          ? ("under_review" as const)
          : persisted.status === "needs_review"
            ? ("under_review" as const)
            : persisted.status === "rejected"
              ? ("missing" as const)
              : (persisted.status as typeof document.status);
      return { ...document, status: mappedStatus };
    }
    return match ? { ...document, status: "uploaded" as const } : document;
  });

  const bureauKeys: RequiredDocumentKey[] = [
    "experian_report",
    "equifax_report",
    "transunion_report",
  ];
  const uploadedBureaus = bureauKeys.filter((key) =>
    documents.some((document) => document.key === key && document.status !== "missing"),
  );
  const totalUploaded = documents.filter((document) => document.status !== "missing").length;
  const allDocumentsUploaded = documents.every((document) => document.status !== "missing");

  const parsedReadyBureaus = parsedReports.filter(
    (report) => report.parseStatus === "parsed" || report.parseStatus === "reviewed",
  ).length;
  const reportReadiness =
    parsedReadyBureaus === 3
      ? "ready"
      : uploadedBureaus.length > 0
        ? "partial"
        : lead.reportReadiness;
  const documentCollectionStatus =
    documents.some((document) => document.status === "missing") && totalUploaded === 0
      ? lead.documentCollectionStatus
      : allDocumentsUploaded
      ? "under_review"
      : totalUploaded > 0
        ? "partially_uploaded"
        : lead.documentCollectionStatus;
  const leadStatus =
    totalUploaded > 0 && lead.leadStatus === "consultation_booked"
      ? "awaiting_documents"
      : lead.leadStatus;

  return {
    ...lead,
    documents,
    reportReadiness,
    documentCollectionStatus,
    leadStatus,
    intakeStatus: lead.intakeStatus === "not_started" ? "in_progress" : lead.intakeStatus,
  };
}

const mockLeads: Lead[] = [
  {
    id: "lead_001",
    fullName: "Marcus Reed",
    email: "marcus@example.com",
    phone: "(901) 555-0181",
    source: "Homepage Hero CTA",
    bookingStatus: "booked",
    intakeStatus: "not_started",
    consultationStatus: "scheduled",
    leadStatus: "consultation_booked",
    portalAccountCreated: true,
    reportReadiness: "unknown",
    documentCollectionStatus: "missing",
    contractPacketStatus: "not_sent",
    aiReviewStatus: "not_ready",
    documents: buildDocuments({}),
    contractDocuments: buildContractDocuments({}),
    notes: ["Consult booked from hero CTA.", "Needs intake completion after call."],
    createdAt: "2026-03-21T10:30:00.000Z",
    updatedAt: "2026-03-23T08:12:00.000Z",
  },
  {
    id: "lead_002",
    fullName: "Tiana Brooks",
    email: "tiana@example.com",
    phone: "(312) 555-0188",
    source: "Book Consultation Page",
    bookingStatus: "booked",
    intakeStatus: "in_progress",
    consultationStatus: "completed",
    leadStatus: "awaiting_documents",
    portalAccountCreated: true,
    reportReadiness: "partial",
    documentCollectionStatus: "partially_uploaded",
    contractPacketStatus: "not_sent",
    aiReviewStatus: "not_ready",
    documents: buildDocuments({
      valid_id: "uploaded",
      experian_report: "uploaded",
      equifax_report: "missing",
      transunion_report: "missing",
    }),
    contractDocuments: buildContractDocuments({}),
    notes: ["Consultation completed.", "Client started intake, reports still pending."],
    createdAt: "2026-03-20T14:00:00.000Z",
    updatedAt: "2026-03-23T15:25:00.000Z",
  },
  {
    id: "lead_003",
    fullName: "Devon Miles",
    email: "devon@example.com",
    phone: "(404) 555-0193",
    source: "Direct Intake",
    bookingStatus: "not_booked",
    intakeStatus: "completed",
    consultationStatus: "not_scheduled",
    leadStatus: "awaiting_documents",
    portalAccountCreated: true,
    reportReadiness: "not_ready",
    documentCollectionStatus: "missing",
    contractPacketStatus: "sent",
    aiReviewStatus: "not_ready",
    documents: buildDocuments({
      valid_id: "uploaded",
      proof_of_address: "uploaded",
    }),
    contractDocuments: buildContractDocuments(
      {
        service_agreement: "sent",
        consumer_rights_disclosure: "sent",
        cancellation_form: "sent",
        authorization_release_information: "sent",
        authorization_submit_disputes: "sent",
        consumer_directed_dispute_authorization: "sent",
        consumer_file_request_form: "sent",
      },
      {
        service_agreement: { sentAt: "2026-03-24T09:15:00.000Z" },
        consumer_rights_disclosure: { sentAt: "2026-03-24T09:15:00.000Z" },
        cancellation_form: { sentAt: "2026-03-24T09:15:00.000Z" },
        authorization_release_information: { sentAt: "2026-03-24T09:15:00.000Z" },
        authorization_submit_disputes: { sentAt: "2026-03-24T09:15:00.000Z" },
        consumer_directed_dispute_authorization: { sentAt: "2026-03-24T09:15:00.000Z" },
        consumer_file_request_form: { sentAt: "2026-03-24T09:15:00.000Z" },
      },
    ),
    notes: ["Intake complete.", "Awaiting bureau reports and identity documents."],
    createdAt: "2026-03-19T11:05:00.000Z",
    updatedAt: "2026-03-24T09:10:00.000Z",
  },
  {
    id: "lead_004",
    fullName: "Jasmine Carter",
    email: "jasmine@example.com",
    phone: "(615) 555-0172",
    source: "Results Page CTA",
    bookingStatus: "completed",
    intakeStatus: "completed",
    consultationStatus: "completed",
    leadStatus: "ready_for_review",
    portalAccountCreated: true,
    reportReadiness: "ready",
    documentCollectionStatus: "under_review",
    contractPacketStatus: "partially_signed",
    aiReviewStatus: "awaiting_admin_review",
    documents: buildDocuments({
      valid_id: "under_review",
      proof_of_address: "under_review",
      experian_report: "under_review",
      equifax_report: "under_review",
      transunion_report: "under_review",
    }),
    contractDocuments: buildContractDocuments(
      {
        service_agreement: "signed",
        consumer_rights_disclosure: "signed",
        cancellation_form: "awaiting_signature",
        authorization_release_information: "signed",
        authorization_submit_disputes: "awaiting_signature",
        consumer_directed_dispute_authorization: "sent",
        consumer_file_request_form: "sent",
      },
      {
        service_agreement: {
          sentAt: "2026-03-24T11:00:00.000Z",
          signedAt: "2026-03-24T11:22:00.000Z",
        },
        consumer_rights_disclosure: {
          sentAt: "2026-03-24T11:00:00.000Z",
          signedAt: "2026-03-24T11:25:00.000Z",
        },
        cancellation_form: { sentAt: "2026-03-24T11:00:00.000Z" },
        authorization_release_information: {
          sentAt: "2026-03-24T11:00:00.000Z",
          signedAt: "2026-03-24T11:27:00.000Z",
        },
        authorization_submit_disputes: { sentAt: "2026-03-24T11:00:00.000Z" },
        consumer_directed_dispute_authorization: { sentAt: "2026-03-24T11:00:00.000Z" },
        consumer_file_request_form: { sentAt: "2026-03-24T11:00:00.000Z" },
      },
    ),
    notes: ["All intake steps complete.", "File is ready for admin review."],
    createdAt: "2026-03-18T09:00:00.000Z",
    updatedAt: "2026-03-24T10:45:00.000Z",
    disputeDraft: {
      bureau: "Experian",
      generatedAt: "2026-03-25T13:10:00.000Z",
      status: "awaiting_admin_review",
      summary:
        "Draft dispute prepared from uploaded bureau reports, normalized findings, and the stored dispute template.",
      letterText:
        "Date: March 25, 2026\n\nTo: Experian\n\nRe: Request for Reinvestigation\n\nI am writing to dispute information appearing in my credit file that I believe may be inaccurate, incomplete, inconsistent, or unverifiable. Please review the item below and reinvestigate it.\n\n- Atlas Auto Finance (1842): Balance and payment history appear inconsistent and should be reinvestigated.\n\nPlease send me an updated copy of my credit report after your reinvestigation is complete.\n\nSincerely,\nJasmine Carter",
      findings: [
        buildSeedFinding({
          bureau: "Experian",
          accountName: "Atlas Auto Finance",
          accountLast4: "1842",
          defectCode: "inconsistent_balance",
          reason: "Balances, payment history, or status fields appear internally inconsistent.",
        }),
      ],
      modelInputNotes: [
        "Used uploaded bureau reports as the source-of-truth input set.",
        "Applied standardized defect categories before draft generation.",
        "Prepared as a draft only for admin review. No auto-send behavior.",
      ],
      violationAnalysis: buildFallbackViolationAnalysis(),
      reviewedAt: "2026-03-25T13:20:00.000Z",
      adminReviewNotes: [
        "Draft reviewed for tone, recipient, and issue framing.",
        "Still waiting on final mailing approval.",
      ],
    },
    },
  {
    id: "lead_005",
    fullName: "Andre Walker",
    email: "andre@example.com",
    phone: "(713) 555-0104",
    source: "Referral",
    bookingStatus: "completed",
    intakeStatus: "completed",
    consultationStatus: "completed",
    leadStatus: "active_client",
    portalAccountCreated: true,
    reportReadiness: "ready",
    documentCollectionStatus: "complete",
    contractPacketStatus: "completed",
    aiReviewStatus: "mailed",
    documents: buildDocuments({
      valid_id: "complete",
      proof_of_address: "complete",
      experian_report: "complete",
      equifax_report: "complete",
      transunion_report: "complete",
    }),
    contractDocuments: buildContractDocuments(
      {
        service_agreement: "signed",
        consumer_rights_disclosure: "signed",
        cancellation_form: "signed",
        authorization_release_information: "signed",
        authorization_submit_disputes: "signed",
        consumer_directed_dispute_authorization: "signed",
        consumer_file_request_form: "signed",
      },
      {
        service_agreement: {
          sentAt: "2026-03-23T08:15:00.000Z",
          signedAt: "2026-03-23T08:40:00.000Z",
        },
        consumer_rights_disclosure: {
          sentAt: "2026-03-23T08:15:00.000Z",
          signedAt: "2026-03-23T08:42:00.000Z",
        },
        cancellation_form: {
          sentAt: "2026-03-23T08:15:00.000Z",
          signedAt: "2026-03-23T08:43:00.000Z",
        },
        authorization_release_information: {
          sentAt: "2026-03-23T08:15:00.000Z",
          signedAt: "2026-03-23T08:45:00.000Z",
        },
        authorization_submit_disputes: {
          sentAt: "2026-03-23T08:15:00.000Z",
          signedAt: "2026-03-23T08:46:00.000Z",
        },
        consumer_directed_dispute_authorization: {
          sentAt: "2026-03-23T08:15:00.000Z",
          signedAt: "2026-03-23T08:47:00.000Z",
        },
        consumer_file_request_form: {
          sentAt: "2026-03-23T08:15:00.000Z",
          signedAt: "2026-03-23T08:48:00.000Z",
        },
      },
    ),
    notes: ["Client activated.", "Ready for document workflow and ongoing case management."],
    createdAt: "2026-03-17T08:40:00.000Z",
    updatedAt: "2026-03-24T11:10:00.000Z",
    disputeDraft: {
      bureau: "Experian",
      generatedAt: "2026-03-24T13:00:00.000Z",
      status: "mailed",
      summary:
        "Final dispute letter was reviewed, approved, and moved into the certified mail workflow.",
      letterText:
        "Date: March 24, 2026\n\nTo: Experian\n\nRe: Final approved dispute mailing copy\n\nThis is the approved mailing version of the dispute letter prepared after AI review and admin edits.\n\nSincerely,\nAndre Walker",
      findings: [
        buildSeedFinding({
          bureau: "Experian",
          accountName: "Atlas Auto Finance",
          accountLast4: "1842",
          defectCode: "inconsistent_balance",
          reason: "Balances, payment history, or status fields appear internally inconsistent.",
        }),
      ],
      modelInputNotes: [
        "Approved after admin review.",
        "Prepared as the mailing-ready final letter for certified mail export.",
      ],
      violationAnalysis: buildFallbackViolationAnalysis(),
      reviewedAt: "2026-03-24T13:10:00.000Z",
      approvedAt: "2026-03-24T13:30:00.000Z",
      approvedBy: "Admin reviewer",
      lastEditedAt: "2026-03-24T13:18:00.000Z",
      adminReviewNotes: [
        "Minor edits applied before mailing approval.",
        "Approved for certified mail on March 24, 2026.",
      ],
    },
    certifiedMailPacket: {
      id: "cmp_lead_005",
      leadId: "lead_005",
      disputeBureau: "Experian",
      recipient: {
        bureau: "Experian",
        recipientName: "Experian",
        street1: "P.O. Box 4500",
        city: "Allen",
        state: "TX",
        postalCode: "75013",
      },
      approvedAt: "2026-03-24T13:30:00.000Z",
      approvedBy: "Admin reviewer",
      letterText: "Final approved dispute letter placeholder for mailing workflow.",
      internalNotes: ["Tracking entered after batch mailing export."],
      queueStatus: "mailed",
      workflowStatus: "tracking_pending",
      queuedAt: "2026-03-24T13:45:00.000Z",
      processedAt: "2026-03-24T14:00:00.000Z",
      mailedAt: "2026-03-24T14:30:00.000Z",
      trackingNumber: "70151230000123456789",
      proofOfMailing: "Proof placeholder saved to future document store.",
      signedReturnReceiptStatus: "received",
      signedReturnReceiptPath: "/mailing/return-receipts/lead_005_experian_signed_receipt.pdf",
      signedReturnReceiptReceivedAt: "2026-03-27T11:20:00.000Z",
      signedReturnReceiptSigner: "Experian Mailroom",
      deliveryStatus: "in_transit",
    },
  },
];

export const leadStatusMeta: Record<
  LeadStatus,
  { label: string; tone: string; description: string }
> = {
  new_lead: {
    label: "New Lead",
    tone: "bg-zinc-900 text-zinc-200 border-white/10",
    description: "A new lead has entered the system but has not booked or started intake.",
  },
  consultation_booked: {
    label: "Consultation Booked",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "Consultation is booked and waiting for the next handoff into intake.",
  },
  intake_started: {
    label: "Intake Started",
    tone: "bg-white/10 text-white border-white/10",
    description: "The lead has started intake but still needs to complete the workflow.",
  },
  intake_completed: {
    label: "Intake Completed",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "Intake is complete and ready for the next internal decision.",
  },
  awaiting_documents: {
    label: "Awaiting Documents",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/20",
    description: "The lead has progressed but still owes reports or supporting documents.",
  },
  ready_for_review: {
    label: "Ready For Review",
    tone: "bg-sky-500/12 text-sky-200 border-sky-400/20",
    description: "The file is organized and ready for internal review.",
  },
  active_client: {
    label: "Active Client",
    tone: "bg-emerald-500/14 text-emerald-200 border-emerald-400/20",
    description: "The lead has fully converted into an active client workflow.",
  },
  closed: {
    label: "Closed",
    tone: "bg-zinc-800 text-zinc-300 border-white/10",
    description: "The lead or client file has been closed out of the active workflow.",
  },
};

export const reportReadinessMeta: Record<
  ReportReadinessStatus,
  { label: string; tone: string; description: string }
> = {
  unknown: {
    label: "Readiness Unknown",
    tone: "bg-zinc-900 text-zinc-200 border-white/10",
    description: "The client has not confirmed whether all 3 bureau reports are ready.",
  },
  not_ready: {
    label: "Reports Missing",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    description: "The client still needs to obtain one or more bureau reports.",
  },
  partial: {
    label: "Partial Reports",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/20",
    description: "Some bureau reports are available, but the set is incomplete.",
  },
  ready: {
    label: "3 Reports Ready",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "Experian, Equifax, and TransUnion are available for review.",
  },
};

export const documentCollectionMeta: Record<
  DocumentCollectionStatus,
  { label: string; tone: string; description: string }
> = {
  missing: {
    label: "Missing Documents",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    description: "Required identity documents or bureau reports are still missing.",
  },
  partially_uploaded: {
    label: "Partially Uploaded",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "Some required items are uploaded, but the file is not complete.",
  },
  under_review: {
    label: "Documents Under Review",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    description: "Required documents are in, but the review is not finished yet.",
  },
  complete: {
    label: "Complete",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "All required documents are complete and accepted in the workflow.",
  },
};

export const aiReviewStatusMeta: Record<
  AIReviewStatus,
  { label: string; tone: string; description: string }
> = {
  not_ready: {
    label: "Not Ready",
    tone: "bg-zinc-900 text-zinc-200 border-white/10",
    description: "AI review cannot run until the required report conditions are met.",
  },
  documents_pending: {
    label: "Documents Pending",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    description: "The file is still missing one or more required uploads.",
  },
  documents_submitted: {
    label: "Documents Submitted",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/20",
    description: "Required documents are uploaded and waiting on verification.",
  },
  documents_verified: {
    label: "Documents Verified",
    tone: "bg-sky-500/12 text-sky-200 border-sky-400/20",
    description: "Required documents are verified, but report parsing still needs to finish.",
  },
  eligible_for_processing: {
    label: "Eligible For Processing",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "The file has cleared document and report readiness and can be queued for AI.",
  },
  queued_for_ai: {
    label: "Queued For AI",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "The dispute file is queued for AI generation.",
  },
  ready_for_ai: {
    label: "Ready For AI Review",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "All 3 bureau reports are present and the file can move into AI review.",
  },
  ai_in_progress: {
    label: "AI In Progress",
    tone: "bg-sky-500/12 text-sky-200 border-sky-400/20",
    description: "The file is currently moving through the AI review stage.",
  },
  ai_generated: {
    label: "AI Generated",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "AI generation completed and the draft is ready for admin review.",
  },
  draft_generated: {
    label: "Dispute Draft Generated",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "A draft dispute letter has been generated for human review.",
  },
  awaiting_admin_review: {
    label: "Awaiting Admin Review",
    tone: "bg-indigo-500/12 text-indigo-200 border-indigo-400/20",
    description: "The draft and findings are ready for admin review and editing.",
  },
  rejected: {
    label: "Rejected",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    description: "The draft was rejected and must be regenerated or corrected.",
  },
  approved: {
    label: "Approved",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/20",
    description: "The draft is approved and can move into the mailing workflow.",
  },
  service_rendered: {
    label: "Service Rendered",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "Service is rendered and the payment workflow can open.",
  },
  queued_for_mailing: {
    label: "Queued For Mailing",
    tone: "bg-sky-500/12 text-sky-200 border-sky-400/20",
    description: "The approved dispute is queued in the mailing workflow.",
  },
  mailed: {
    label: "Mailed",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "The final approved dispute has been mailed.",
  },
};

export function getAllLeads(): Lead[] {
  return mockLeads.map(applyRuntimeLeadState);
}

export function getLeadById(id: string): Lead | undefined {
  const lead = mockLeads.find((item) => item.id === id);
  return lead ? applyRuntimeLeadState(lead) : undefined;
}

export function getLeadByEmail(email: string): Lead | undefined {
  const lead = mockLeads.find((item) => item.email.toLowerCase() === email.toLowerCase());
  return lead ? applyRuntimeLeadState(lead) : undefined;
}

export function getRecentBookings(): Lead[] {
  return mockLeads.filter((lead) => lead.bookingStatus !== "not_booked").slice(0, 3);
}

export function getIntakeProgressLeads(): Lead[] {
  return mockLeads.filter(
    (lead) =>
      lead.intakeStatus === "in_progress" ||
      lead.documentCollectionStatus === "missing" ||
      lead.documentCollectionStatus === "partially_uploaded",
  );
}

export function getPipelineCounts() {
  return Object.keys(leadStatusMeta).map((statusKey) => {
    const status = statusKey as LeadStatus;
    return {
      status,
      count: mockLeads.filter((lead) => lead.leadStatus === status).length,
      ...leadStatusMeta[status],
    };
  });
}

export function getDocumentCounts(documents: RequiredDocument[]) {
  const total = documents.length;
  const uploaded = documents.filter((doc) => doc.status !== "missing").length;
  const ready = documents.filter(
    (doc) => doc.status === "under_review" || doc.status === "complete",
  ).length;
  const missing = total - uploaded;

  return { total, uploaded, ready, missing };
}

export function hasAllBureauReports(documents: RequiredDocument[]) {
  const requiredReports: RequiredDocumentKey[] = [
    "experian_report",
    "equifax_report",
    "transunion_report",
  ];

  return requiredReports.every((key) => {
    const doc = documents.find((item) => item.key === key);
    return doc && doc.status !== "missing";
  });
}

export function isLeadReadyForReview(lead: Lead) {
  return (
    lead.reportReadiness === "ready" &&
    (lead.documentCollectionStatus === "under_review" ||
      lead.documentCollectionStatus === "complete")
  );
}

export function isLeadReadyForAIReview(lead: Lead) {
  return hasAllBureauReports(lead.documents) && lead.reportReadiness === "ready";
}

export function createLeadDraftFromBooking() {
  // Placeholder for future persistence:
  // 1. insert lead into PostgreSQL
  // 2. return created lead id for Calendly handoff
  return {
    nextStatus: leadStatusMeta.consultation_booked.label,
    handoffNote: "Booking should create or update the lead record before intake begins.",
  };
}

export function updateLeadFromIntake() {
  // Placeholder for future persistence:
  // 1. locate lead by email/id/session
  // 2. update intake state and lead status
  // 3. queue admin review if complete
  return {
    nextStatus: leadStatusMeta.awaiting_documents.label,
    handoffNote:
      "Intake should update the existing lead record, capture report readiness, and track missing uploads before review.",
  };
}

export function getIntakeWorkflowSnapshot(lead?: Lead) {
  const sampleLead = lead ? applyRuntimeLeadState(lead) : applyRuntimeLeadState(mockLeads[1]);

  return {
    reportReadiness: sampleLead.reportReadiness,
    documentCollectionStatus: sampleLead.documentCollectionStatus,
    documents: sampleLead.documents,
  };
}

export function getLeadPipelineColorMeta(lead: Lead) {
  const stage = getLeadStatusBarModel(lead).stage;

  if (stage === "green") {
    return {
      label: "Mailed",
      railClassName: "bg-emerald-500",
      chipClassName: "border-emerald-400/25 bg-emerald-500/12 text-emerald-700",
    };
  }

  if (stage === "yellow") {
    return {
      label: "Awaiting Review",
      railClassName: "bg-amber-400",
      chipClassName: "border-amber-400/25 bg-amber-500/12 text-amber-700",
    };
  }

  if (stage === "orange") {
    return {
      label: "Ready For AI",
      railClassName: "bg-orange-400",
      chipClassName: "border-orange-400/25 bg-orange-500/12 text-orange-700",
    };
  }

  return {
    label: "Beginning Stage",
    railClassName: "bg-rose-500",
    chipClassName: "border-rose-400/25 bg-rose-500/12 text-rose-700",
  };
}

export function getLeadCurrentStep(lead: Lead) {
  return getLeadStatusBarModel(lead).stepLabel;
}

export function getLeadStatusBarModel(lead: Lead) {
  const hasConsultRequest =
    lead.bookingStatus === "booked" || lead.consultationStatus === "scheduled";
  const mailed =
    lead.aiReviewStatus === "mailed" ||
    Boolean(lead.certifiedMailPacket) ||
    lead.leadStatus === "active_client";
  const awaitingReview =
    lead.aiReviewStatus === "draft_generated" ||
    lead.aiReviewStatus === "awaiting_admin_review" ||
    lead.aiReviewStatus === "approved" ||
    lead.leadStatus === "ready_for_review";
  const readyForAi =
    lead.aiReviewStatus === "ready_for_ai" ||
    lead.aiReviewStatus === "ai_in_progress" ||
    (lead.reportReadiness === "ready" &&
      (lead.documentCollectionStatus === "complete" ||
        lead.documentCollectionStatus === "under_review"));

  let stage: "red" | "orange" | "yellow" | "green" = "red";
  let stepLabel = "Intake / onboarding started";
  let showStripe = false;

  if (mailed) {
    stage = "green";
    stepLabel = "Review completed / mailed";
    showStripe = true;
  } else if (awaitingReview) {
    stage = "yellow";
    stepLabel = "Generation complete / awaiting review";
    showStripe = true;
  } else if (readyForAi) {
    stage = "orange";
    stepLabel = "Uploads completed / ready for AI";
  } else if (hasConsultRequest) {
    stepLabel = "Consultation requested / intake started";
  } else if (lead.intakeStatus === "completed") {
    stepLabel = "Intake complete / awaiting uploads";
  }

  let problem = "Needs intake and onboarding started.";

  if (mailed) {
    problem = "Mailing is out and payment authorization should be secured.";
  } else if (awaitingReview) {
    problem = "Draft is generated and waiting on admin review.";
  } else if (readyForAi) {
    problem = "All required uploads are in and the file can move to AI generation.";
  } else if (lead.reportReadiness !== "ready") {
    problem = "Missing or incomplete bureau reports.";
  } else if (
    lead.documentCollectionStatus === "missing" ||
    lead.documentCollectionStatus === "partially_uploaded"
  ) {
    problem = "Required identity or report documents are still missing.";
  } else if (hasConsultRequest) {
    problem = "Consultation requested. Client needs follow-up.";
  }

  return {
    stage,
    stepLabel,
    problem,
    isVibrating: stage !== "red",
    showPhone: hasConsultRequest,
    showStripe,
  };
}
