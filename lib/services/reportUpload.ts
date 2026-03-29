import fs from "node:fs/promises";
import path from "node:path";
import { createOrUpdateUploadedDocument, enqueueDocumentValidation, processDocumentValidationJob } from "@/lib/services/documentService";
import { processCreditReportParsingJob } from "@/lib/services/creditReportService";
import { evaluateAndQueueAiForLead, processAiGenerationJob } from "@/lib/services/disputeService";
import { sanitizeUploadFilename } from "@/lib/security/request";
import { trackDocumentsUploadedForLead } from "@/lib/services/analytics";
import {
  queueDocumentsMissingNotifications,
  queueDocumentsUploadedAdminAlert,
} from "@/lib/services/notifications";
import { getLeadById } from "@/lib/leads";
import type { Lead, RequiredDocumentKey } from "@/lib/types";

function isBureauReport(documentKey: RequiredDocumentKey) {
  return (
    documentKey === "experian_report" ||
    documentKey === "equifax_report" ||
    documentKey === "transunion_report"
  );
}

export async function processDocumentUpload(input: {
  lead: Lead;
  documentKey: RequiredDocumentKey;
  file: File;
}) {
  const leadId = input.lead.id;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), ".data", "report-uploads", leadId);
  await fs.mkdir(uploadDir, { recursive: true });

  const safeOriginalFilename = sanitizeUploadFilename(input.file.name);
  const ext = path.extname(safeOriginalFilename) || ".pdf";
  const filename = `${input.documentKey}${ext}`;
  const storagePath = path.join(uploadDir, filename);
  await fs.writeFile(storagePath, buffer);

  const document = await createOrUpdateUploadedDocument({
    lead: input.lead,
    key: input.documentKey,
    storagePath,
    mimeType: input.file.type,
    originalFilename: safeOriginalFilename,
  });

  await enqueueDocumentValidation({
    leadId,
    documentKey: input.documentKey,
    documentId: document.id,
  });
  const validatedDocument = await processDocumentValidationJob({
    payload: {
      leadId,
      documentKey: input.documentKey,
      documentId: document.id,
    },
  });

  let parsedReport = null;
  if (isBureauReport(input.documentKey) && validatedDocument.status === "validated") {
    parsedReport = await processCreditReportParsingJob({
      payload: {
        leadId,
        documentKey: input.documentKey,
        documentId: document.id,
      },
    });
  }

  await trackDocumentsUploadedForLead({
    lead: input.lead,
    documentKey: input.documentKey,
    bureau: parsedReport?.bureau,
    parseStatus: parsedReport?.parseStatus ?? "pending",
    extractionStrategy: parsedReport?.extractionStrategy,
    tradelineCount: parsedReport?.tradelineCount,
  });

  const refreshedLead = getLeadById(leadId);
  if (refreshedLead) {
    await queueDocumentsUploadedAdminAlert({
      lead: refreshedLead,
    });

    if (
      refreshedLead.documentCollectionStatus !== "complete" ||
      refreshedLead.reportReadiness !== "ready"
    ) {
      await queueDocumentsMissingNotifications({
        lead: refreshedLead,
      });
    }

    const aiResult = await evaluateAndQueueAiForLead(refreshedLead, "document_upload");
    if (aiResult.eligible) {
      await processAiGenerationJob({
        payload: {
          leadId: refreshedLead.id,
          disputeId: aiResult.dispute.id,
        },
      }).catch(() => null);
    }
  }

  return {
    document: validatedDocument,
    parsedReport,
    storagePath,
    originalFilename: safeOriginalFilename,
  };
}

export async function processReportUpload(input: {
  lead: Lead;
  documentKey: RequiredDocumentKey;
  file: File;
}) {
  return processDocumentUpload(input);
}
