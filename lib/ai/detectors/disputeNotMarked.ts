import type { DefectFinding } from "@/lib/types";
import { createDefectFinding, type NormalizedDetectorTradeline } from "@/lib/ai/detectors/shared";

export function detectDisputeNotMarked(groups: Map<string, NormalizedDetectorTradeline[]>) {
  const findings: DefectFinding[] = [];

  for (const tradelines of groups.values()) {
    const hasDisputeNotation = tradelines.some((item) => item.disputeText.includes("dispute"));
    if (!hasDisputeNotation) {
      continue;
    }

    tradelines.forEach((tradeline) => {
      if (!tradeline.disputeText.includes("dispute")) {
        findings.push(
          createDefectFinding({
            defectCode: "dispute_not_marked",
            tradeline,
            reason: "Another bureau record shows dispute notation while this one does not.",
            confidence: 0.87,
            score: 20,
            supportingFacts: tradelines.map(
              (item) => `${item.bureau}: ${item.disputeComments || item.remarks || "no dispute notation"}`,
            ),
          }),
        );
      }
    });
  }

  return findings;
}
