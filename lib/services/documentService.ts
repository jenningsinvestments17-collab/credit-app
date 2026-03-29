import path from "node:path";
import { getDocumentRecord, getDocumentRecordsByLead, saveDocumentRecord } from "@/lib/db/documentState";
import { emitDomainEvent } from "@/lib/events/emit";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/eventNames";
import { buildAutomationJob, processAutomationQueue, queueAutomationJob } from "@/lib/queue/automationQueue";
import {
  getCreditReportState,
  processCreditReportParsingJob,
  queueCreditReportParsing,
  syncCreditReportRecord,
} from "@/lib/services/creditReportService";
import type { DocumentRecord, Lead, RequiredDocumentKey, RequiredDocumentStatus } from "@/lib/types";

const REQUIRED_DOCUMENT_KEYS: RequiredDocumentKey[] = [
  "experian_report",
  "equifax_report",
  "transunion_report",
  "valid_id",
  "proof_of_address",
];

function nowIso() {
  return new Date().toISOString();
}

export function isUploaded(status: RequiredDocumentStatus) {
  return status !== "missing" && status !== "rejected";
}

export function isValidated(status: RequiredDocumentStatus) {
  return status === "validated" || status === "under_review" || status === "complete";
}

function isBureauReport(key: RequiredDocumentKey) {
  return ["experian_report", "equifax_report", "transunion_report"].includes(key);
}

function detectDocumentValidationResult(record: DocumentRecord) {
  const ext = path.extname(record.originalFilename ?? record.storagePath ?? "").toLowerCase();
  if (!REQUIRED_DOCUMENT_KEYS.includes(record.key)) {
    return { status: "rejected" as const, reason: "Unsupported required document kind." };
  }

  if (!record.storagePath) {
    return { status: "rejected" as const, reason: "Storage path missing." };
  }

  if (isBureauReport(record.key)) {
    if (record.mimeType !== "application/pdf" && ext !== ".pdf") {
      return { status: "rejected" as const, reason: "Credit reports must be uploaded as PDF files." };
    }
    return { status: "validated" as const };
  }

  if (![".pdf", ".png", ".jpg", ".jpeg"].includes(ext)) {
    return { status: "rejected" as const, reason: "ID and proof-of-address files must be PDF or image files." };
  }

  return { status: "needs_review" as const, reason: "Identity documents require manual verification before AI eligibility." };
}

export function getRequiredDocumentState(lead: Lead) {
  const persisted = getDocumentRecordsByLead(lead.id);
  const requiredDocuments = REQUIRED_DOCUMENT_KEYS.map((key) => {
    const leadDocument = lead.documents.find((item) => item.key === key);
    const record = persisted.find((item) => item.key === key);
    const status = (record?.status ?? leadDocument?.status ?? "missing") as RequiredDocumentStatus;
    return {
      key,
      label: leadDocument?.label ?? key,
      status,
      uploaded: isUploaded(status),
      validated: isValidated(status),
      validationReason: record?.validationReason,
    };
  });
  const reportState = getCreditReportState(lead);
  const allUploaded = requiredDocuments.every((document) => document.uploaded);
  const allValidated = requiredDocuments.every((document) => document.validated);

  return {
    requiredDocuments,
    allUploaded,
    allValidated,
    missingDocuments: requiredDocuments.filter((document) => !document.uploaded),
    pendingValidationDocuments: requiredDocuments.filter((document) => !document.validated),
    rejectedDocuments: requiredDocuments.filter((document) => document.status === "rejected"),
    reportState,
    status: !allUploaded
      ? "documents_pending"
      : !allValidated
        ? "documents_submitted"
        : "documents_verified",
  } as const;
}

export async function createOrUpdateUploadedDocument(input: {
  lead: Lead;
  key: RequiredDocumentKey;
  storagePath: string;
  mimeType?: string;
  originalFilename?: string;
}) {
  const existing = getDocumentRecord(input.lead.id, input.key);
  const timestamp = nowIso();
  const record: DocumentRecord = {
    id: existing?.id ?? `doc_${input.lead.id}_${input.key}`,
    leadId: input.lead.id,
    key: input.key,
    status: "uploaded",
    storagePath: input.storagePath,
    mimeType: input.mimeType,
    originalFilename: input.originalFilename,
    uploadedAt: existing?.uploadedAt ?? timestamp,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    validationReason: undefined,
  };
  saveDocumentRecord(record);
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.documentUploaded,
    aggregateType: "document",
    aggregateId: record.id,
    actorType: "client",
    actorId: input.lead.id,
    payload: {
      leadId: input.lead.id,
      documentKey: input.key,
      status: record.status,
    },
    metadata: {
      source: "createOrUpdateUploadedDocument",
    },
  });
  return record;
}

export async function enqueueDocumentValidation(input: {
  leadId: string;
  documentKey: RequiredDocumentKey;
  documentId: string;
}) {
  const job = buildAutomationJob({
    id: `job_validate_${input.leadId}_${input.documentKey}_${Date.now()}`,
    type: "document_validation",
    payload: input,
    dedupeKey: `document_validation:${input.leadId}:${input.documentKey}`,
    maxAttempts: 5,
  });
  return queueAutomationJob(job);
}

export async function processDocumentValidationJob(job: {
  payload: {
    leadId?: string;
    documentKey?: string;
    documentId?: string;
  };
}) {
  const leadId = String(job.payload.leadId ?? "");
  const documentKey = job.payload.documentKey as RequiredDocumentKey | undefined;
  if (!leadId || !documentKey) {
    throw new Error("Document validation job is missing required identifiers.");
  }

  const record = getDocumentRecord(leadId, documentKey);
  if (!record) {
    throw new Error("Document record not found.");
  }

  const result = detectDocumentValidationResult(record);
  const updated: DocumentRecord = {
    ...record,
    status: result.status,
    validationReason: result.reason,
    reviewedAt: result.status === "validated" || result.status === "needs_review" ? nowIso() : record.reviewedAt,
    updatedAt: nowIso(),
  };
  saveDocumentRecord(updated);

  if (isBureauReport(documentKey) && updated.status === "validated") {
    await syncCreditReportRecord({
      leadId,
      documentId: updated.id,
      documentKey,
      storagePath: updated.storagePath,
      originalFilename: updated.originalFilename,
    });
    await queueCreditReportParsing({
      leadId,
      documentId: updated.id,
      documentKey,
    });
  }

  await emitDomainEvent({
    type: updated.status === "validated" ? DOMAIN_EVENT_NAMES.documentsCompleted : DOMAIN_EVENT_NAMES.documentsReadyForReview,
    aggregateType: "document",
    aggregateId: updated.id,
    actorType: "system",
    actorId: "document_validation_worker",
    payload: {
      leadId,
      documentKey,
      status: updated.status,
      reason: updated.validationReason,
    },
    metadata: {
      source: "processDocumentValidationJob",
    },
  });

  return updated;
}

export async function kickDocumentAutomation(leadId: string) {
  await processAutomationQueue("document_validation", processDocumentValidationJob, 10);
  await processAutomationQueue("report_extraction", processCreditReportParsingJob, 10);
  return getDocumentRecordsByLead(leadId);
}
