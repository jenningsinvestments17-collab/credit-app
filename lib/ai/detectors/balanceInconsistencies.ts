import type { DefectFinding } from "@/lib/types";
import { createDefectFinding, type NormalizedDetectorTradeline } from "@/lib/ai/detectors/shared";

export function detectBalanceInconsistencies(groups: Map<string, NormalizedDetectorTradeline[]>) {
  const findings: DefectFinding[] = [];

  for (const tradelines of groups.values()) {
    const balances = Array.from(
      new Set(tradelines.map((item) => item.balanceNumber).filter((value): value is number => value !== undefined)),
    );

    if (balances.length > 1) {
      tradelines.forEach((tradeline) => {
        findings.push(
          createDefectFinding({
            defectCode: "inconsistent_balance",
            tradeline,
            reason: "Balance values do not align across bureau reporting for the same tradeline.",
            confidence: 0.89,
            score: 22,
            supportingFacts: tradelines.map((item) => `${item.bureau}: ${item.balance || "not shown"}`),
          }),
        );
      });
    }

    tradelines.forEach((tradeline) => {
      if (
        tradeline.statusText.includes("paid") &&
        (tradeline.balanceNumber ?? 0) > 0
      ) {
        findings.push(
          createDefectFinding({
            defectCode: "amount_misrepresented",
            tradeline,
            reason: "The account is reported as paid while still carrying a positive balance.",
            confidence: 0.86,
            score: 24,
            supportingFacts: [
              `Status: ${tradeline.status || "not shown"}`,
              `Balance: ${tradeline.balance || "not shown"}`,
            ],
          }),
        );
      }
    });
  }

  return findings;
}
