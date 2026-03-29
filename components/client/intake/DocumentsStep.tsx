import { markDocumentsStepVisited } from "@/lib/services/intakeService";
import { getParsedReportRecord } from "@/lib/reports/parsedReportState";
import { SecureUploadCenter } from "@/components/intake/SecureUploadCenter";
import type { IntakeViewModel } from "@/types/intake";
import type { RequiredDocumentKey } from "@/lib/types";

export async function DocumentsStep({ model }: { model: IntakeViewModel }) {
  await markDocumentsStepVisited(model.userId);

  function getParsedReportForDocumentKey(documentKey: RequiredDocumentKey) {
    if (
      documentKey !== "experian_report" &&
      documentKey !== "equifax_report" &&
      documentKey !== "transunion_report"
    ) {
      return null;
    }

    return getParsedReportRecord(model.lead.id, documentKey);
  }

  return (
    <SecureUploadCenter
      lead={model.lead}
      documents={model.documents}
      uploadGateCopy={model.uploadGateCopy}
      returnTo="/intake/documents"
      parsedReports={{
        valid_id: null,
        proof_of_address: null,
        experian_report: getParsedReportForDocumentKey("experian_report"),
        equifax_report: getParsedReportForDocumentKey("equifax_report"),
        transunion_report: getParsedReportForDocumentKey("transunion_report"),
      }}
    />
  );
}
