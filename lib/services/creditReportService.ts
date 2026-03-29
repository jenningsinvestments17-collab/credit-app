import { extractPdfContent } from "@/lib/ai/reportExtraction";
import { parseTradelineRecords, summarizeParsedReport } from "@/lib/ai/reportParsing";
import { emitDomainEvent } from "@/lib/events/emit";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/eventNames";
import { getLeadById } from "@/lib/leads";
import { recordOpsError } from "@/lib/monitoring/ops";
import { buildAutomationJob, queueAutomationJob } from "@/lib/queue/automationQueue";
import { getParsedReportRecord, getParsedReportRecordsByLead, saveParsedReportRecord } from "@/lib/reports/parsedReportState";
import type {
  Bureau,
  BureauReportRecord,
  Lead,
  ReportSource,
  RequiredDocument,
  RequiredDocumentKey,
} from "@/lib/types";

const REQUIRED_BUREAU_KEYS: Array<{
  bureau: Bureau;
  key: RequiredDocumentKey;
}> = [
  { bureau: "Experian", key: "experian_report" },
  { bureau: "Equifax", key: "equifax_report" },
  { bureau: "TransUnion", key: "transunion_report" },
];

function nowIso() {
  return new Date().toISOString();
}

function getDocument(lead: Lead, key: RequiredDocumentKey): RequiredDocument | undefined {
  return lead.documents.find((document) => document.key === key);
}

function getBureauForDocumentKey(documentKey: RequiredDocumentKey): Bureau {
  if (documentKey === "equifax_report") return "Equifax";
  if (documentKey === "transunion_report") return "TransUnion";
  return "Experian";
}

function mapReportSource(
  lead: Lead,
  bureau: Bureau,
  key: RequiredDocumentKey,
  record: BureauReportRecord | null,
): ReportSource {
  const document = getDocument(lead, key);

  return {
    bureau,
    documentKey: key,
    uploaded: Boolean(document && document.status !== "missing" && document.status !== "rejected"),
    originalFilename: record?.originalFilename,
    storagePath: record?.storagePath,
    parseStatus: record?.parseStatus ?? "pending",
    extractionStrategy: record?.extractionStrategy,
    scannedLikely: record?.scannedLikely,
    parseError: record?.parseError,
    extractedText: record?.parsedText,
    normalizedSummary: record?.normalizedSummary,
    parsedTradelines: record?.parsedTradelines ?? [],
  };
}

export function getCreditReportState(lead: Lead) {
  const records = getParsedReportRecordsByLead(lead.id);
  const reportSources = REQUIRED_BUREAU_KEYS.map(({ bureau, key }) =>
    mapReportSource(
      lead,
      bureau,
      key,
      records.find((record) => record.bureau === bureau) ?? null,
    ),
  );
  const uploadedCount = reportSources.filter((source) => source.uploaded).length;
  const parsedCount = reportSources.filter(
    (source) => source.parseStatus === "parsed" || source.parseStatus === "reviewed",
  ).length;
  const failedCount = reportSources.filter((source) => source.parseStatus === "failed").length;
  const allUploaded = uploadedCount === REQUIRED_BUREAU_KEYS.length;
  const allReady = parsedCount === REQUIRED_BUREAU_KEYS.length;

  return {
    reportSources,
    records,
    uploadedCount,
    parsedCount,
    failedCount,
    allUploaded,
    allReady,
    blockedReasons: reportSources.flatMap((source) => {
      if (!source.uploaded) {
        return [`${source.bureau} report is missing.`];
      }
      if (source.parseStatus === "failed") {
        return [`${source.bureau} report parsing failed and needs admin review.`];
      }
      if (source.parseStatus !== "parsed" && source.parseStatus !== "reviewed") {
        return [`${source.bureau} report is not ready for AI processing yet.`];
      }
      return [];
    }),
  };
}

export function syncCreditReportRecord(input: {
  leadId: string;
  documentId: string;
  documentKey: RequiredDocumentKey;
  storagePath?: string;
  originalFilename?: string;
}) {
  const existing = getParsedReportRecord(input.leadId, input.documentKey);
  const timestamp = nowIso();
  const record: BureauReportRecord = {
    id: existing?.id ?? `${input.leadId}_${input.documentKey}`,
    documentId: input.documentId,
    leadId: input.leadId,
    bureau: getBureauForDocumentKey(input.documentKey),
    documentKey: input.documentKey,
    originalFilename: input.originalFilename ?? existing?.originalFilename,
    storagePath: input.storagePath ?? existing?.storagePath,
    parseStatus: existing?.parseStatus ?? "pending",
    extractionStrategy: existing?.extractionStrategy,
    scannedLikely: existing?.scannedLikely,
    parsedText: existing?.parsedText,
    normalizedSummary: existing?.normalizedSummary,
    parsedTradelines: existing?.parsedTradelines,
    tradelineCount: existing?.tradelineCount,
    parseError: existing?.parseError,
    pageCount: existing?.pageCount,
    adminReadyOverrideAt: existing?.adminReadyOverrideAt,
    parsedAt: existing?.parsedAt,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  return saveParsedReportRecord(record);
}

export async function queueCreditReportParsing(input: {
  leadId: string;
  documentId: string;
  documentKey: RequiredDocumentKey;
}) {
  const job = buildAutomationJob({
    id: `job_parse_${input.leadId}_${input.documentKey}_${Date.now()}`,
    type: "report_extraction",
    payload: input,
    dedupeKey: `report_extraction:${input.leadId}:${input.documentKey}`,
    maxAttempts: 5,
  });
  return queueAutomationJob(job);
}

export async function processCreditReportParsingJob(job: {
  payload: {
    leadId?: string;
    documentKey?: string;
    documentId?: string;
  };
}) {
  const leadId = String(job.payload.leadId ?? "");
  const documentKey = job.payload.documentKey as RequiredDocumentKey | undefined;
  if (!leadId || !documentKey) {
    throw new Error("Report parsing job is missing identifiers.");
  }

  const record = getParsedReportRecord(leadId, documentKey);
  const storagePath = record?.storagePath;
  if (!record || !storagePath) {
    throw new Error("Credit report record not found.");
  }

  const processingRecord = saveParsedReportRecord({
    ...record,
    parseStatus: "processing",
    parseError: undefined,
    updatedAt: nowIso(),
  });

  const extracted = extractPdfContent(storagePath);
  const bureau = processingRecord.bureau;
  const parsedTradelines = parseTradelineRecords(extracted.text ?? undefined, bureau);
  const parseStatus =
    extracted.text && parsedTradelines.length
      ? "parsed"
      : extracted.text
        ? "failed"
        : "failed";

  const nextRecord = saveParsedReportRecord({
    ...processingRecord,
    extractionStrategy: extracted.extractionStrategy,
    scannedLikely: extracted.scannedLikely,
    parsedText: extracted.text ?? undefined,
    normalizedSummary:
      extracted.text && parsedTradelines.length
        ? summarizeParsedReport(parsedTradelines, bureau)
        : extracted.text
          ? `${bureau} report uploaded but no tradelines were parsed yet.`
          : `${bureau} report uploaded but extraction failed.`,
    parseStatus,
    parsedTradelines,
    tradelineCount: parsedTradelines.length,
    parseError: extracted.error,
    pageCount: extracted.pageCount,
    parsedAt: nowIso(),
    updatedAt: nowIso(),
  });

  if (parseStatus === "failed") {
    await recordOpsError({
      scope: "credit_report.parse",
      message: nextRecord.parseError ?? `${bureau} report parsing failed.`,
      metadata: {
        leadId,
        documentKey,
        bureau,
      },
    });
  } else {
    await emitDomainEvent({
      type: DOMAIN_EVENT_NAMES.reportsCompleted,
      aggregateType: "document",
      aggregateId: nextRecord.id,
      actorType: "system",
      actorId: "report_extraction_worker",
      payload: {
        leadId,
        bureau,
        parseStatus: nextRecord.parseStatus,
        tradelineCount: nextRecord.tradelineCount ?? 0,
      },
      metadata: {
        source: "processCreditReportParsingJob",
      },
    });
  }

  return nextRecord;
}

export function markCreditReportReadyByAdminOverride(input: {
  leadId: string;
  bureau: Bureau;
}) {
  const record = getParsedReportRecord(input.leadId, `${input.bureau.toLowerCase()}_report` as RequiredDocumentKey);

  if (!record) {
    throw new Error("Credit report record not found for override.");
  }

  return saveParsedReportRecord({
    ...record,
    parseStatus: "reviewed",
    adminReadyOverrideAt: nowIso(),
    updatedAt: nowIso(),
  });
}
