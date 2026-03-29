import { getDefectCodeDefinition } from "@/lib/ai/defectCodes";
import type { Bureau, DefectCode, DefectFinding, TradelineReviewInput } from "@/lib/types";

export type NormalizedDetectorTradeline = TradelineReviewInput & {
  bureau: Bureau;
  accountKey: string;
  accountLast4: string;
  balanceNumber?: number;
  pastDueNumber?: number;
  statusText: string;
  remarksText: string;
  disputeText: string;
  dateOpenedDate?: Date;
  rawText: string;
};

export function normalizeAmount(value: string | undefined) {
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

export function parseDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function buildAccountKey(tradeline: TradelineReviewInput) {
  const account = (tradeline.accountName || tradeline.furnisher || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const last4 = String(tradeline.accountNumberMask || "").match(/(\d{4})$/)?.[1] || "xxxx";
  return `${account}:${last4}`;
}

export function normalizeDetectorTradelines(tradelines: TradelineReviewInput[]) {
  return tradelines
    .filter((tradeline): tradeline is TradelineReviewInput & { bureau: Bureau } => Boolean(tradeline.bureau))
    .map((tradeline) => ({
      ...tradeline,
      bureau: tradeline.bureau!,
      accountKey: buildAccountKey(tradeline),
      accountLast4: String(tradeline.accountNumberMask || "").match(/(\d{4})$/)?.[1] || "xxxx",
      balanceNumber: normalizeAmount(tradeline.balance),
      pastDueNumber: normalizeAmount(tradeline.pastDue),
      statusText: String(tradeline.status || "").toLowerCase(),
      remarksText: String(tradeline.remarks || "").toLowerCase(),
      disputeText: `${tradeline.remarks || ""} ${tradeline.disputeComments || ""}`.toLowerCase(),
      dateOpenedDate: parseDate(tradeline.dateOpened),
      rawText: JSON.stringify(tradeline.rawData ?? {}).toLowerCase(),
    }));
}

export function createDefectFinding(input: {
  defectCode: DefectCode;
  tradeline: NormalizedDetectorTradeline;
  reason: string;
  confidence: number;
  score: number;
  supportingFacts: string[];
}): DefectFinding {
  const definition = getDefectCodeDefinition(input.defectCode);
  return {
    accountKey: input.tradeline.accountKey,
    bureau: input.tradeline.bureau,
    accountName: input.tradeline.accountName || input.tradeline.furnisher || "Unknown account",
    accountLast4: input.tradeline.accountLast4,
    defectCode: definition.code,
    title: definition.title,
    category: definition.category,
    severity: definition.severity,
    laws: definition.laws,
    reason: input.reason,
    consumerHarm: definition.consumerHarm,
    disputeGoal: definition.disputeGoal,
    suggestedTone: definition.suggestedTone,
    strategyLevel: definition.strategyLevel,
    outputTemplateKey: definition.outputTemplateKey,
    escalationReady: definition.escalationReady,
    confidence: input.confidence,
    score: input.score,
    supportingFacts: input.supportingFacts,
    tradelineData: input.tradeline,
  };
}
