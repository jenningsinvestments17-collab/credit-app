import type {
  CaseScoreAnalysis,
  DefectFinding,
  DefectTone,
  DisputeStrategyOutput,
  EscalationAnalysis,
  EscalationFlag,
  EscalationTier,
} from "@/lib/types";

function hasCode(findings: DefectFinding[], code: DefectFinding["defectCode"]) {
  return findings.some((finding) => finding.defectCode === code);
}

function detectEscalationFlags(input: {
  currentFindings: DefectFinding[];
  currentVersion?: number;
  previousVersions?: Array<{ findings: DefectFinding[] }>;
  postDisputeFailure?: boolean;
}): EscalationFlag[] {
  const flags: EscalationFlag[] = [];
  const currentFindings = input.currentFindings;
  const priorFindings = input.previousVersions?.flatMap((version) => version.findings) ?? [];

  if (
    hasCode(currentFindings, "dispute_not_marked") &&
    currentFindings.some((finding) =>
      ["inconsistent_balance", "amount_misrepresented", "status_misrepresented", "inconsistent_status"].includes(finding.defectCode),
    )
  ) {
    flags.push({
      type: "combo_dispute_and_inaccuracy",
      title: "Dispute notation plus inaccuracy combo",
      reason: "The file shows missing dispute notation alongside substantive reporting inaccuracies.",
      weight: 22,
    });
  }

  const repeatedCodes = new Set(
    currentFindings
      .filter((finding) => priorFindings.some((prior) => prior.defectCode === finding.defectCode && prior.accountKey === finding.accountKey))
      .map((finding) => finding.defectCode),
  );
  if (repeatedCodes.size) {
    flags.push({
      type: "repeat_violation_across_versions",
      title: "Repeated violations across versions",
      reason: `The same defect pattern persisted across ${repeatedCodes.size} tracked defect code(s).`,
      weight: 18,
    });
  }

  if (input.postDisputeFailure) {
    flags.push({
      type: "post_dispute_failure",
      title: "Post-dispute failure",
      reason: "The file appears to have remained inaccurate after the dispute stage advanced.",
      weight: 24,
    });
  }

  const multiBureauKeys = new Set(
    currentFindings
      .map((finding) => finding.accountKey)
      .filter((key) => new Set(currentFindings.filter((finding) => finding.accountKey === key).map((finding) => finding.bureau)).size > 1),
  );
  if (multiBureauKeys.size) {
    flags.push({
      type: "multi_bureau_inconsistency",
      title: "Multi-bureau inconsistency",
      reason: "The same account shows defect patterns across multiple bureau files.",
      weight: 16,
    });
  }

  if (hasCode(currentFindings, "obsolete_debt") || hasCode(currentFindings, "suspected_re_aging")) {
    flags.push({
      type: "critical_obsolescence",
      title: "Obsolescence or re-aging risk",
      reason: "The file contains reporting-age defects that create higher legal leverage.",
      weight: 26,
    });
  }

  if (hasCode(currentFindings, "mixed_file_issue")) {
    flags.push({
      type: "mixed_file_risk",
      title: "Mixed file risk",
      reason: "The file contains indicators of identity mixing or cross-consumer contamination.",
      weight: 30,
    });
  }

  if (currentFindings.filter((finding) => finding.severity === "high" || finding.severity === "critical").length >= 3) {
    flags.push({
      type: "multi_high_severity_combination",
      title: "Multiple high-severity defects",
      reason: "The file contains multiple high-severity defect combinations that raise the escalation profile.",
      weight: 20,
    });
  }

  return flags;
}

function resolveTier(score: CaseScoreAnalysis, flags: EscalationFlag[]): EscalationTier {
  const flagWeight = flags.reduce((sum, flag) => sum + flag.weight, 0);

  if (score.criticalCount >= 2 || flagWeight >= 50 || hasFlag(flags, "mixed_file_risk")) {
    return "litigation_candidate";
  }
  if (score.classification === "high" || flagWeight >= 28) {
    return "legal_leverage";
  }
  if (score.classification === "medium" || flagWeight >= 12) {
    return "aggressive";
  }
  return "basic";
}

function hasFlag(flags: EscalationFlag[], type: EscalationFlag["type"]) {
  return flags.some((flag) => flag.type === type);
}

function resolveTone(tier: EscalationTier): DefectTone {
  if (tier === "litigation_candidate" || tier === "legal_leverage") {
    return "legal_leverage";
  }
  if (tier === "aggressive") {
    return "aggressive";
  }
  return "factual";
}

function buildRecommendation(tier: EscalationTier, flags: EscalationFlag[]) {
  if (tier === "litigation_candidate") {
    return "Preserve the record, reference the strongest statutory concerns carefully, and prepare the file for further review if the bureau does not address the reported issues.";
  }
  if (tier === "legal_leverage") {
    return "Use a firm statutory tone, include the strongest cited obligations cautiously, and preserve a clear escalation trail for follow-up.";
  }
  if (tier === "aggressive") {
    return "Use a stronger dispute posture that highlights repeated inconsistencies and requests reinvestigation and correction.";
  }
  if (flags.length) {
    return "Keep the dispute factual but note the specific defects that justify closer reinvestigation.";
  }
  return "Use a clean factual dispute focused on accurate reinvestigation and correction.";
}

export function buildEscalationAnalysis(input: {
  caseScore: CaseScoreAnalysis;
  currentFindings: DefectFinding[];
  previousVersions?: Array<{ findings: DefectFinding[] }>;
  postDisputeFailure?: boolean;
}): EscalationAnalysis {
  const flags = detectEscalationFlags({
    currentFindings: input.currentFindings,
    previousVersions: input.previousVersions,
    postDisputeFailure: input.postDisputeFailure,
  });
  const tier = resolveTier(input.caseScore, flags);

  return {
    tier,
    tone: resolveTone(tier),
    includeStatutes: tier !== "basic",
    escalationRecommendation: buildRecommendation(tier, flags),
    claimPreservation: tier === "legal_leverage" || tier === "litigation_candidate" || flags.length >= 2,
    flags,
  };
}

export function buildDisputeStrategyOutput(input: {
  caseScore: CaseScoreAnalysis;
  currentFindings: DefectFinding[];
  previousVersions?: Array<{ findings: DefectFinding[] }>;
  postDisputeFailure?: boolean;
}): DisputeStrategyOutput {
  return {
    caseScore: input.caseScore,
    escalation: buildEscalationAnalysis(input),
  };
}
