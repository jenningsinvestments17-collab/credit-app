import { buildClaimPacket } from "@/lib/disputes/claimPacket";
import type {
  DefectFinding,
  DisputeStrategyOutput,
  EscalationFlag,
  EscalationPipelineOutput,
  EscalationStage,
  EscalationStageTransition,
  ViolationAnalysis,
} from "@/lib/types";

function hasFlag(flags: EscalationFlag[], type: EscalationFlag["type"]) {
  return flags.some((flag) => flag.type === type);
}

function multiHighSeverityCombination(findings: DefectFinding[]) {
  return findings.filter((finding) => finding.severity === "high" || finding.severity === "critical").length >= 3;
}

function resolveRecommendedStage(input: {
  strategyOutput: DisputeStrategyOutput;
  findings: DefectFinding[];
}) {
  const { escalation, caseScore } = input.strategyOutput;

  if (
    escalation.tier === "litigation_candidate" ||
    hasFlag(escalation.flags, "post_dispute_failure") ||
    hasFlag(escalation.flags, "mixed_file_risk")
  ) {
    return {
      stage: "claim_preparation" as EscalationStage,
      reason: "The case meets the threshold for claim preparation based on litigation-candidate scoring or a post-dispute failure pattern.",
      recommendedNextStage: "external_action" as EscalationStage,
    };
  }

  if (
    escalation.tier === "legal_leverage" ||
    hasFlag(escalation.flags, "multi_bureau_inconsistency") ||
    multiHighSeverityCombination(input.findings)
  ) {
    return {
      stage: "formal_escalation_notice" as EscalationStage,
      reason: "The case contains repeated or high-leverage defects that justify a formal escalation notice.",
      recommendedNextStage: "claim_preparation" as EscalationStage,
    };
  }

  if (
    escalation.tier === "aggressive" ||
    hasFlag(escalation.flags, "repeat_violation_across_versions") ||
    caseScore.highSeverityCount >= 2
  ) {
    return {
      stage: "reinforcement_dispute" as EscalationStage,
      reason: "The case shows unresolved or repeated reporting defects and should move to a reinforcement dispute stage.",
      recommendedNextStage: "formal_escalation_notice" as EscalationStage,
    };
  }

  return {
    stage: "initial_dispute" as EscalationStage,
    reason: "The case remains in the initial dispute stage because the file does not yet require a stronger escalation path.",
    recommendedNextStage: "reinforcement_dispute" as EscalationStage,
  };
}

export function buildEscalationPipeline(input: {
  disputeId: string;
  leadId: string;
  strategyOutput: DisputeStrategyOutput;
  findings: DefectFinding[];
  violationAnalysis: ViolationAnalysis;
  overrideStage?: EscalationStage;
  generatedAt?: string;
}): EscalationPipelineOutput {
  const resolved = resolveRecommendedStage({
    strategyOutput: input.strategyOutput,
    findings: input.findings,
  });
  const stage = input.overrideStage ?? resolved.stage;
  const claimPacket = buildClaimPacket({
    disputeId: input.disputeId,
    leadId: input.leadId,
    stage,
    strategyOutput: {
      ...input.strategyOutput,
      pipeline: {
        stage,
        stageReason: input.overrideStage
          ? `Admin override applied. Default recommendation was ${resolved.stage.replaceAll("_", " ")}.`
          : resolved.reason,
        recommendedNextStage: stage === "external_action" ? undefined : resolved.recommendedNextStage,
        manualApprovalRequired: stage !== "initial_dispute",
        claimPacket: {} as never,
      },
    },
    violationAnalysis: input.violationAnalysis,
    findings: input.findings,
    generatedAt: input.generatedAt,
  });

  return {
    stage,
    stageReason: input.overrideStage
      ? `Admin override applied. Default recommendation was ${resolved.stage.replaceAll("_", " ")}.`
      : resolved.reason,
    recommendedNextStage: stage === "external_action" ? undefined : resolved.recommendedNextStage,
    manualApprovalRequired: stage !== "initial_dispute",
    claimPacket,
  };
}

export function buildEscalationTransition(input: {
  fromStage?: EscalationStage;
  toStage: EscalationStage;
  actorId: string;
  actorType: "system" | "admin";
  reason: string;
  occurredAt?: string;
  overrideApplied?: boolean;
}): EscalationStageTransition {
  return {
    stage: input.toStage,
    reason: input.reason,
    actorId: input.actorId,
    actorType: input.actorType,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    overrideApplied: input.overrideApplied,
  };
}
