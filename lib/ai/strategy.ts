import type { ViolationAnalysis, ViolationStrategy } from "@/lib/types";

export function getStrategyLabel(strategy: ViolationStrategy) {
  if (strategy === "dispute_with_legal_leverage") {
    return "Dispute + legal leverage";
  }

  if (strategy === "aggressive_dispute") {
    return "Aggressive dispute";
  }

  return "Basic dispute";
}

export function buildStructuredGeneratorInput(analysis: ViolationAnalysis) {
  return {
    version: analysis.version,
    overallStrength: analysis.overallStrength,
    strategy: analysis.strategy,
    violations: analysis.violations.map((violation) => ({
      type: violation.type,
      law: violation.law,
      score: violation.score,
      confidence: violation.confidence,
      accountKey: violation.accountKey,
      bureau: violation.bureau,
      accountName: violation.accountName,
      explanation: violation.explanation,
      supportingFacts: violation.supportingFacts,
    })),
    recommendedNextSteps: analysis.recommendedNextSteps,
  };
}
