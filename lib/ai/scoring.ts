import type {
  CaseScoreAnalysis,
  CaseStrengthClassification,
  DefectFinding,
  DefectSeverity,
  ScoredDefectFinding,
} from "@/lib/types";

const SEVERITY_POINTS: Record<DefectSeverity, number> = {
  low: 8,
  medium: 16,
  high: 26,
  critical: 40,
};

function confidenceMultiplier(confidence: number) {
  return Math.max(0.5, Math.min(1.25, confidence));
}

function evidenceBonus(finding: DefectFinding) {
  const factBonus = Math.min(finding.supportingFacts.length * 2, 8);
  const lawBonus = Math.min(finding.laws.length, 3);
  return factBonus + lawBonus;
}

export function scoreDefectFinding(finding: DefectFinding): ScoredDefectFinding {
  const severityPoints = SEVERITY_POINTS[finding.severity];
  const multiplier = confidenceMultiplier(finding.confidence);
  const bonus = evidenceBonus(finding);
  const totalScore = Math.round(severityPoints * multiplier + bonus);

  return {
    ...finding,
    severityPoints,
    confidenceMultiplier: multiplier,
    evidenceBonus: bonus,
    totalScore,
  };
}

function classifyCase(totalScore: number, highSeverityCount: number, criticalCount: number): CaseStrengthClassification {
  if (criticalCount >= 1 || totalScore >= 120 || highSeverityCount >= 4) {
    return "high";
  }
  if (totalScore >= 55 || highSeverityCount >= 2) {
    return "medium";
  }
  return "low";
}

export function scoreCaseFindings(input: {
  findings: DefectFinding[];
  version?: number;
}): CaseScoreAnalysis {
  const findings = input.findings.map(scoreDefectFinding).sort((a, b) => b.totalScore - a.totalScore);
  const totalScore = findings.reduce((sum, finding) => sum + finding.totalScore, 0);
  const highSeverityCount = findings.filter((finding) => finding.severity === "high").length;
  const criticalCount = findings.filter((finding) => finding.severity === "critical").length;

  return {
    version: input.version ?? 1,
    totalScore,
    highSeverityCount,
    criticalCount,
    classification: classifyCase(totalScore, highSeverityCount, criticalCount),
    findings,
  };
}
