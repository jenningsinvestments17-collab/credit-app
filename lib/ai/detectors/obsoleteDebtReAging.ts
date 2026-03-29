import type { DefectFinding } from "@/lib/types";
import { createDefectFinding, type NormalizedDetectorTradeline } from "@/lib/ai/detectors/shared";

function yearsSince(date: Date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

export function detectObsoleteDebtAndReAging(tradelines: NormalizedDetectorTradeline[]) {
  const findings: DefectFinding[] = [];

  tradelines.forEach((tradeline) => {
    const derogatory = ["collection", "charge", "late", "repossession", "delinquent"].some((word) =>
      `${tradeline.statusText} ${tradeline.remarksText}`.includes(word),
    );

    if (tradeline.dateOpenedDate && derogatory && yearsSince(tradeline.dateOpenedDate) >= 7) {
      findings.push(
        createDefectFinding({
          defectCode: "obsolete_debt",
          tradeline,
          reason: "The account appears derogatory and older than the standard seven-year reporting window.",
          confidence: 0.93,
          score: 30,
          supportingFacts: [
            `Date opened: ${tradeline.dateOpened || "not shown"}`,
            `Status: ${tradeline.status || "not shown"}`,
          ],
        }),
      );
    }

    const explicitReAge = tradeline.rawText.includes("re-aged") || tradeline.rawText.includes("reaged");
    const suspiciousDates =
      tradeline.dateOpenedDate &&
      yearsSince(tradeline.dateOpenedDate) > 5 &&
      tradeline.statusText.includes("current") &&
      tradeline.remarksText.includes("charge");

    if (explicitReAge || suspiciousDates) {
      findings.push(
        createDefectFinding({
          defectCode: "suspected_re_aging",
          tradeline,
          reason: "The timeline suggests the delinquency history may have been refreshed or improperly re-aged.",
          confidence: 0.88,
          score: 28,
          supportingFacts: [
            `Date opened: ${tradeline.dateOpened || "not shown"}`,
            `Status: ${tradeline.status || "not shown"}`,
            `Remarks: ${tradeline.remarks || "not shown"}`,
          ],
        }),
      );
    }
  });

  return findings;
}
