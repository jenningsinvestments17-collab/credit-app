import type {
  Bureau,
  TradelineReviewInput,
  ViolationAnalysis,
  ViolationRecord,
  ViolationStrategy,
  ViolationType,
} from "@/lib/types";

type ViolationWeightConfig = {
  law: string;
  score: number;
  confidence: number;
};

const VIOLATION_WEIGHTS: Record<ViolationType, ViolationWeightConfig> = {
  inconsistent_balance_across_bureaus: {
    law: "FCRA § 1681e(b)",
    score: 22,
    confidence: 0.89,
  },
  duplicate_accounts: {
    law: "FCRA § 1681e(b)",
    score: 18,
    confidence: 0.84,
  },
  failure_to_mark_dispute: {
    law: "FCRA § 1681s-2(a)(3)",
    score: 20,
    confidence: 0.87,
  },
  obsolete_debt_7_years: {
    law: "FCRA § 1681c(a)",
    score: 30,
    confidence: 0.93,
  },
  re_aging_detection: {
    law: "FCRA § 1681s-2(a)(1)",
    score: 28,
    confidence: 0.88,
  },
  misrepresentation_of_amount_status: {
    law: "FCRA § 1681e(b)",
    score: 24,
    confidence: 0.86,
  },
};

type NormalizedTradeline = TradelineReviewInput & {
  bureau: Bureau;
  accountKey: string;
  balanceNumber?: number;
  pastDueNumber?: number;
  statusText: string;
  remarksText: string;
  disputeText: string;
  dateOpenedDate?: Date;
};

function normalizeAmount(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/[^0-9.-]/g, "");
  if (!normalized) {
    return undefined;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
}

function parseDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildAccountKey(tradeline: TradelineReviewInput) {
  const account = (tradeline.accountName || tradeline.furnisher || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const last4 = String(tradeline.accountNumberMask || "")
    .match(/(\d{4})$/)?.[1] || "xxxx";
  return `${account}:${last4}`;
}

function normalizeTradelines(tradelines: TradelineReviewInput[]): NormalizedTradeline[] {
  return tradelines
    .filter((tradeline): tradeline is TradelineReviewInput & { bureau: Bureau } => Boolean(tradeline.bureau))
    .map((tradeline) => ({
      ...tradeline,
      bureau: tradeline.bureau!,
      accountKey: buildAccountKey(tradeline),
      balanceNumber: normalizeAmount(tradeline.balance),
      pastDueNumber: normalizeAmount(tradeline.pastDue),
      statusText: String(tradeline.status || "").toLowerCase(),
      remarksText: String(tradeline.remarks || "").toLowerCase(),
      disputeText: `${tradeline.remarks || ""} ${tradeline.disputeComments || ""}`.toLowerCase(),
      dateOpenedDate: parseDate(tradeline.dateOpened),
    }));
}

function buildViolation(input: {
  type: ViolationType;
  tradeline: NormalizedTradeline;
  explanation: string;
  supportingFacts: string[];
}): ViolationRecord {
  const base = VIOLATION_WEIGHTS[input.type];
  return {
    type: input.type,
    law: base.law,
    score: base.score,
    confidence: base.confidence,
    accountKey: input.tradeline.accountKey,
    bureau: input.tradeline.bureau,
    accountName: input.tradeline.accountName || input.tradeline.furnisher || "Unknown account",
    explanation: input.explanation,
    supportingFacts: input.supportingFacts,
  };
}

function detectInconsistentBalances(groups: Map<string, NormalizedTradeline[]>) {
  const violations: ViolationRecord[] = [];
  for (const tradelines of groups.values()) {
    const balances = Array.from(
      new Set(tradelines.map((item) => item.balanceNumber).filter((value): value is number => value !== undefined)),
    );
    if (balances.length > 1) {
      tradelines.forEach((tradeline) => {
        violations.push(
          buildViolation({
            type: "inconsistent_balance_across_bureaus",
            tradeline,
            explanation: "The same account reports materially different balances across bureau files.",
            supportingFacts: tradelines.map(
              (item) => `${item.bureau}: ${item.balance || "no balance shown"}`,
            ),
          }),
        );
      });
    }
  }
  return violations;
}

function detectDuplicateAccounts(groups: Map<string, NormalizedTradeline[]>) {
  const violations: ViolationRecord[] = [];
  for (const tradelines of groups.values()) {
    const byBureau = tradelines.reduce<Record<string, number>>((acc, tradeline) => {
      acc[tradeline.bureau] = (acc[tradeline.bureau] ?? 0) + 1;
      return acc;
    }, {});

    tradelines.forEach((tradeline) => {
      if ((byBureau[tradeline.bureau] ?? 0) > 1) {
        violations.push(
          buildViolation({
            type: "duplicate_accounts",
            tradeline,
            explanation: "The same account appears duplicated within the same bureau reporting set.",
            supportingFacts: [`${tradeline.bureau} duplicate count: ${byBureau[tradeline.bureau]}`],
          }),
        );
      }
    });
  }
  return violations;
}

function detectFailureToMarkDispute(groups: Map<string, NormalizedTradeline[]>) {
  const violations: ViolationRecord[] = [];
  for (const tradelines of groups.values()) {
    const hasDisputeNotationAnywhere = tradelines.some((item) => item.disputeText.includes("dispute"));
    if (!hasDisputeNotationAnywhere) {
      continue;
    }

    tradelines.forEach((tradeline) => {
      if (!tradeline.disputeText.includes("dispute")) {
        violations.push(
          buildViolation({
            type: "failure_to_mark_dispute",
            tradeline,
            explanation: "The account appears disputed in one bureau file but lacks a dispute notation in another.",
            supportingFacts: tradelines.map(
              (item) => `${item.bureau}: ${item.disputeComments || item.remarks || "no dispute notation"}`,
            ),
          }),
        );
      }
    });
  }
  return violations;
}

function yearsSince(date: Date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function detectObsoleteDebt(tradelines: NormalizedTradeline[]) {
  return tradelines.flatMap((tradeline) => {
    if (!tradeline.dateOpenedDate) {
      return [];
    }

    const derogatory = ["collection", "charge", "late", "repossession", "delinquent"].some((word) =>
      `${tradeline.statusText} ${tradeline.remarksText}`.includes(word),
    );

    if (derogatory && yearsSince(tradeline.dateOpenedDate) >= 7) {
      return [
        buildViolation({
          type: "obsolete_debt_7_years",
          tradeline,
          explanation: "The account appears derogatory and older than the standard seven-year reporting window.",
          supportingFacts: [
            `Date opened: ${tradeline.dateOpened}`,
            `Status: ${tradeline.status || "not shown"}`,
          ],
        }),
      ];
    }

    return [];
  });
}

function detectReAging(tradelines: NormalizedTradeline[]) {
  return tradelines.flatMap((tradeline) => {
    const rawText = JSON.stringify(tradeline.rawData ?? {}).toLowerCase();
    const explicit = rawText.includes("re-aged") || rawText.includes("reaged");
    const suspiciousAge =
      tradeline.dateOpenedDate &&
      yearsSince(tradeline.dateOpenedDate) > 5 &&
      tradeline.statusText.includes("current") &&
      tradeline.remarksText.includes("charge");

    if (!explicit && !suspiciousAge) {
      return [];
    }

    return [
      buildViolation({
        type: "re_aging_detection",
        tradeline,
        explanation: "The tradeline shows signs that the delinquency timeline may have been improperly refreshed or re-aged.",
        supportingFacts: [
          `Date opened: ${tradeline.dateOpened || "not shown"}`,
          `Status: ${tradeline.status || "not shown"}`,
          `Remarks: ${tradeline.remarks || "not shown"}`,
        ],
      }),
    ];
  });
}

function detectMisrepresentation(tradelines: NormalizedTradeline[]) {
  return tradelines.flatMap((tradeline) => {
    const contradictions = [
      tradeline.statusText.includes("paid") && (tradeline.balanceNumber ?? 0) > 0,
      tradeline.statusText.includes("closed") && (tradeline.pastDueNumber ?? 0) > 0,
      tradeline.statusText.includes("current") && tradeline.remarksText.includes("late"),
      tradeline.statusText.includes("charge") && tradeline.remarksText.includes("current"),
    ];

    if (!contradictions.some(Boolean)) {
      return [];
    }

    return [
      buildViolation({
        type: "misrepresentation_of_amount_status",
        tradeline,
        explanation: "The amount or status fields conflict with each other and suggest inaccurate reporting.",
        supportingFacts: [
          `Status: ${tradeline.status || "not shown"}`,
          `Balance: ${tradeline.balance || "not shown"}`,
          `Past due: ${tradeline.pastDue || "not shown"}`,
          `Remarks: ${tradeline.remarks || "not shown"}`,
        ],
      }),
    ];
  });
}

export function computeViolationStrength(violations: ViolationRecord[]) {
  return Math.min(100, violations.reduce((sum, violation) => sum + violation.score, 0));
}

export function selectViolationStrategy(overallStrength: number): ViolationStrategy {
  if (overallStrength >= 70) {
    return "dispute_with_legal_leverage";
  }
  if (overallStrength >= 35) {
    return "aggressive_dispute";
  }
  return "basic_dispute";
}

function buildSummary(violations: ViolationRecord[], strategy: ViolationStrategy) {
  if (!violations.length) {
    return strategy === "basic_dispute"
      ? "The file does not show strong legal-leverage violations yet, so the draft should stay factual and tightly focused on reinvestigation."
      : "The file includes enough structured issues to support a stronger challenge strategy.";
  }

  const categories = Array.from(new Set(violations.map((item) => item.type.replaceAll("_", " "))));
  return `Detected ${violations.length} structured violation signals across ${categories.length} categories. Recommended strategy: ${strategy.replaceAll("_", " ")}.`;
}

function buildNextSteps(strategy: ViolationStrategy, violations: ViolationRecord[]) {
  const steps = [
    "Keep the dispute letter tied to the verified tradeline facts and the structured violation list.",
    "Preserve bureau report copies, upload confirmations, and mailing proof for follow-up.",
  ];

  if (violations.some((item) => item.type === "failure_to_mark_dispute")) {
    steps.push("Call out the missing dispute notation directly and request corrected bureau coding.");
  }

  if (strategy === "aggressive_dispute") {
    steps.push("Escalate the narrative by emphasizing repeated inconsistencies across reporting fields.");
  }

  if (strategy === "dispute_with_legal_leverage") {
    steps.push("Reserve a follow-up path that references FCRA-specific obligations if the bureau does not correct the file.");
  }

  return steps;
}

export function analyzeViolations(input: { tradelines: TradelineReviewInput[]; version?: number }): ViolationAnalysis {
  const normalized = normalizeTradelines(input.tradelines);
  const groups = normalized.reduce<Map<string, NormalizedTradeline[]>>((map, tradeline) => {
    const existing = map.get(tradeline.accountKey) ?? [];
    existing.push(tradeline);
    map.set(tradeline.accountKey, existing);
    return map;
  }, new Map());

  const violations = [
    ...detectInconsistentBalances(groups),
    ...detectDuplicateAccounts(groups),
    ...detectFailureToMarkDispute(groups),
    ...detectObsoleteDebt(normalized),
    ...detectReAging(normalized),
    ...detectMisrepresentation(normalized),
  ].sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.accountKey.localeCompare(b.accountKey));

  const overallStrength = computeViolationStrength(violations);
  const strategy = selectViolationStrategy(overallStrength);

  return {
    version: input.version ?? 1,
    overallStrength,
    strategy,
    violationSummary: buildSummary(violations, strategy),
    recommendedNextSteps: buildNextSteps(strategy, violations),
    violations,
  };
}

export function buildFallbackViolationAnalysis(): ViolationAnalysis {
  return {
    version: 1,
    overallStrength: 0,
    strategy: "basic_dispute",
    violationSummary:
      "No structured violation analysis has been saved for this draft yet.",
    recommendedNextSteps: [
      "Review the tradelines and supporting report text before final approval.",
      "Keep the dispute factual and tied to the verified account details.",
    ],
    violations: [],
  };
}
