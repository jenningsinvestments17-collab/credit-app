import { generateSimplePdfBuffer } from "@/lib/pdf/generateDisputePdf";
import { buildOutputDisclaimerBlock } from "@/lib/compliance/disclaimers";
import { applyContentGuardrails, sanitizeGeneratedParagraphs } from "@/lib/compliance/guardrails";
import type {
  ClaimPacket,
  DefectFinding,
  DisputeStrategyOutput,
  EscalationStage,
  ViolationAnalysis,
} from "@/lib/types";

function buildEvidenceList(findings: DefectFinding[]) {
  return findings.flatMap((finding) =>
    finding.supportingFacts.map(
      (fact) => `${finding.accountName} (${finding.bureau}, ${finding.accountLast4}): ${fact}`,
    ),
  );
}

function buildNeutralLegalMapping(findings: DefectFinding[]) {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const finding of findings) {
    for (const law of finding.laws) {
      const key = `${finding.defectCode}:${law}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      lines.push(`${finding.title}: ${law}`);
    }
  }

  return lines;
}

function buildRequestedOutcome(stage: EscalationStage) {
  if (stage === "external_action") {
    return "Prepare a complete export bundle so the record can be reviewed outside the platform by the appropriate third party.";
  }
  if (stage === "claim_preparation") {
    return "Preserve the record, organize the evidence, and prepare a neutral claim packet for administrative or legal review if the reporting is not cured.";
  }
  if (stage === "formal_escalation_notice") {
    return "Request a documented reinvestigation outcome, correction of the inaccurate reporting, and confirmation that the escalated notice was received.";
  }
  if (stage === "reinforcement_dispute") {
    return "Request a renewed review that addresses the repeated or unresolved reporting defects with a stronger written record.";
  }
  return "Request reinvestigation, correction, deletion where appropriate, and updated reporting accuracy.";
}

function buildEscalationLetter(input: {
  stage: EscalationStage;
  strategyOutput: DisputeStrategyOutput;
  violationAnalysis: ViolationAnalysis;
}) {
  return applyContentGuardrails([
    `Escalation Stage: ${input.stage.replaceAll("_", " ")}`,
    `Case Strength: ${input.strategyOutput.caseScore.classification}`,
    `Escalation Tier: ${input.strategyOutput.escalation.tier.replaceAll("_", " ")}`,
    "",
    "This notice preserves the reporting history and requests a documented review of the unresolved credit reporting defects identified in the file.",
    input.strategyOutput.escalation.includeStatutes
      ? "The file includes neutral statutory mapping for reference and record preservation."
      : "The file remains framed as a factual reinvestigation request.",
    "",
    `Summary: ${input.violationAnalysis.violationSummary}`,
    "",
    `Recommended path: ${input.strategyOutput.escalation.escalationRecommendation}`,
    "",
    "Requested outcome:",
    buildRequestedOutcome(input.stage),
    "",
    "This packet is generated for documentation and escalation tracking only. It is not legal advice and it does not automatically initiate any outside action.",
    buildOutputDisclaimerBlock(),
  ].join("\n"));
}

function buildClaimPacketText(input: {
  stage: EscalationStage;
  disputeId: string;
  leadId: string;
  strategyOutput: DisputeStrategyOutput;
  violationAnalysis: ViolationAnalysis;
  findings: DefectFinding[];
  timeline: string[];
}) {
  const evidence = buildEvidenceList(input.findings);
  const legalMapping = buildNeutralLegalMapping(input.findings);
  const requestedOutcome = buildRequestedOutcome(input.stage);

  return applyContentGuardrails([
    `Claim Packet`,
    `Dispute: ${input.disputeId}`,
    `Lead: ${input.leadId}`,
    `Stage: ${input.stage.replaceAll("_", " ")}`,
    "",
    "Case Summary",
    `Total score: ${input.strategyOutput.caseScore.totalScore}`,
    `Strength: ${input.strategyOutput.caseScore.classification}`,
    `Escalation tier: ${input.strategyOutput.escalation.tier.replaceAll("_", " ")}`,
    "",
    "Violation Summary",
    input.violationAnalysis.violationSummary,
    "",
    "Timeline",
    ...input.timeline,
    "",
    "Evidence",
    ...evidence,
    "",
    "Neutral Legal Mapping",
    ...legalMapping,
    "",
    "Requested Outcome",
    requestedOutcome,
    "",
    "This packet is informational and administrative in nature. It is not legal advice.",
    buildOutputDisclaimerBlock(),
  ].join("\n"));
}

export function buildClaimPacket(input: {
  disputeId: string;
  leadId: string;
  stage: EscalationStage;
  strategyOutput: DisputeStrategyOutput;
  violationAnalysis: ViolationAnalysis;
  findings: DefectFinding[];
  generatedAt?: string;
}): ClaimPacket {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const evidenceList = sanitizeGeneratedParagraphs(buildEvidenceList(input.findings));
  const neutralLegalMapping = sanitizeGeneratedParagraphs(buildNeutralLegalMapping(input.findings));
  const requestedOutcome = buildRequestedOutcome(input.stage);
  const timeline = [
    `Dispute draft generated and scored at ${generatedAt}.`,
    `Case classified as ${input.strategyOutput.caseScore.classification} with ${input.strategyOutput.caseScore.totalScore} total points.`,
    `Escalation tier assigned as ${input.strategyOutput.escalation.tier.replaceAll("_", " ")}.`,
    `Current stage recorded as ${input.stage.replaceAll("_", " ")}.`,
  ];
  const caseSummary =
    `The file contains ${input.findings.length} structured defect finding(s), ` +
    `${input.strategyOutput.caseScore.highSeverityCount} high-severity finding(s), and ` +
    `${input.strategyOutput.caseScore.criticalCount} critical finding(s).`;
  const escalationLetter = buildEscalationLetter(input);
  const claimPacketBase: ClaimPacket = {
    disputeId: input.disputeId,
    leadId: input.leadId,
    stage: input.stage,
    generatedAt,
    caseSummary,
    violationSummary: input.violationAnalysis.violationSummary,
    timeline,
    evidenceList,
    neutralLegalMapping,
    requestedOutcome,
    escalationLetter,
    claimPacketText: "",
    claimPacketPdfPath: `/generated/${input.disputeId}-${input.stage}-claim-packet.pdf`,
    exportBundlePath: `/generated/${input.disputeId}-${input.stage}-bundle.zip`,
  };

  return {
    ...claimPacketBase,
    claimPacketText: buildClaimPacketText({
      ...input,
      timeline,
    }),
  };
}

export function generateClaimPacketPdfBuffer(packet: ClaimPacket) {
  return generateSimplePdfBuffer(packet.claimPacketText);
}

export function buildExportBundle(packet: ClaimPacket) {
  return {
    manifestVersion: 1,
    generatedAt: packet.generatedAt,
    stage: packet.stage,
    files: [
      {
        kind: "escalation_letter",
        path: `${packet.disputeId}-${packet.stage}-escalation-letter.txt`,
        content: packet.escalationLetter,
      },
      {
        kind: "claim_packet",
        path: `${packet.disputeId}-${packet.stage}-claim-packet.txt`,
        content: packet.claimPacketText,
      },
      {
        kind: "evidence_list",
        path: `${packet.disputeId}-${packet.stage}-evidence.json`,
        content: JSON.stringify(packet.evidenceList, null, 2),
      },
      {
        kind: "timeline",
        path: `${packet.disputeId}-${packet.stage}-timeline.json`,
        content: JSON.stringify(packet.timeline, null, 2),
      },
    ],
  };
}
