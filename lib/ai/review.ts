import { detectDefectFindings } from "@/lib/ai/detectDefects";
import { getCreditReportState } from "@/lib/services/creditReportService";
import { getRequiredDocumentState } from "@/lib/services/documentService";
import type {
  AIReviewStatus,
  Bureau,
  DefectFinding,
  Lead,
  ReportSource,
} from "@/lib/types";

type AIReadinessResult = {
  ready: boolean;
  status: AIReviewStatus;
  missingItems: string[];
  reportSources: ReportSource[];
};

function buildReportSources(lead: Lead): ReportSource[] {
  return getCreditReportState(lead).reportSources;
}

export function getAIReadiness(lead: Lead): AIReadinessResult {
  const reportSources = buildReportSources(lead);
  const documentState = getRequiredDocumentState(lead);
  const reportState = getCreditReportState(lead);

  if (!documentState.allUploaded) {
    return {
      ready: false,
      status: "documents_pending",
      missingItems: documentState.missingDocuments.map((item) => `${item.label} missing`),
      reportSources,
    };
  }

  if (!documentState.allValidated) {
    return {
      ready: false,
      status: "documents_submitted",
      missingItems: documentState.pendingValidationDocuments.map(
        (item) => `${item.label} still waiting on validation`,
      ),
      reportSources,
    };
  }

  if (!reportState.allReady) {
    const missingItems = reportState.blockedReasons.length
      ? reportState.blockedReasons
      : reportSources
          .filter((item) => item.parseStatus !== "parsed" && item.parseStatus !== "reviewed")
          .map((item) => `${item.bureau} report is not AI-ready`);

    return {
      ready: false,
      status: "documents_verified",
      missingItems,
      reportSources,
    };
  }

  return {
    ready: true,
    status: lead.disputeDraft ? lead.disputeDraft.status : "eligible_for_processing",
    missingItems: [],
    reportSources,
  };
}

export function prepareDefectFindings(lead: Lead): DefectFinding[] {
  if (!getAIReadiness(lead).ready) {
    return [];
  }

  return detectDefectFindings(
    buildReportSources(lead).flatMap((source) =>
      (source.parsedTradelines ?? []).map((tradeline) => ({
        ...tradeline,
        bureau: source.bureau,
      })),
    ),
  );
}

export function redactSensitiveValue(value: string) {
  if (value.length <= 4) {
    return value;
  }

  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}
