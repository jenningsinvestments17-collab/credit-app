import type { DefectFinding } from "@/lib/types";
import { createDefectFinding, type NormalizedDetectorTradeline } from "@/lib/ai/detectors/shared";

export function detectDuplicateTradelines(groups: Map<string, NormalizedDetectorTradeline[]>) {
  const findings: DefectFinding[] = [];

  for (const tradelines of groups.values()) {
    const byBureau = tradelines.reduce<Record<string, number>>((acc, tradeline) => {
      acc[tradeline.bureau] = (acc[tradeline.bureau] ?? 0) + 1;
      return acc;
    }, {});

    tradelines.forEach((tradeline) => {
      if ((byBureau[tradeline.bureau] ?? 0) > 1) {
        findings.push(
          createDefectFinding({
            defectCode: "duplicate_tradeline",
            tradeline,
            reason: "The same account appears duplicated within the bureau report.",
            confidence: 0.84,
            score: 18,
            supportingFacts: [`${tradeline.bureau} duplicate count: ${byBureau[tradeline.bureau]}`],
          }),
        );
      }

      const transferSignals = `${tradeline.remarksText} ${tradeline.rawText}`;
      if (transferSignals.includes("transferred") || transferSignals.includes("sold")) {
        findings.push(
          createDefectFinding({
            defectCode: "transfer_sale_double_reporting",
            tradeline,
            reason: "The tradeline includes transfer or sale signals that may indicate overlapping reporting.",
            confidence: 0.8,
            score: 20,
            supportingFacts: [
              `Remarks: ${tradeline.remarks || "not shown"}`,
              `Status: ${tradeline.status || "not shown"}`,
            ],
          }),
        );
      }
    });
  }

  return findings;
}
