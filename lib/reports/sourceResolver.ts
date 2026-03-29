import fs from "node:fs";
import path from "node:path";
import type { Bureau } from "@/lib/types";
import { getUploadedReportRecord } from "@/lib/reports/uploadState";

type ReportSourceOverride = {
  leadId: string;
  bureau: Bureau;
  storagePath: string;
  originalFilename?: string;
};

const OVERRIDE_PATH = path.join(process.cwd(), ".data", "report-source-overrides.json");

function readOverrides(): ReportSourceOverride[] {
  if (!fs.existsSync(OVERRIDE_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(OVERRIDE_PATH, "utf8");
    const parsed = JSON.parse(raw) as ReportSourceOverride[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getReportSourceOverride(leadId: string, bureau: Bureau) {
  const bureauDocumentKey =
    bureau === "Experian"
      ? "experian_report"
      : bureau === "Equifax"
        ? "equifax_report"
        : "transunion_report";

  const uploadedRecord = getUploadedReportRecord(leadId, bureauDocumentKey);
  if (uploadedRecord) {
    return {
      leadId,
      bureau,
      storagePath: uploadedRecord.storagePath,
      originalFilename: uploadedRecord.originalFilename,
    };
  }

  return readOverrides().find(
    (item) => item.leadId === leadId && item.bureau === bureau,
  ) ?? null;
}
