import { detectBalanceInconsistencies } from "@/lib/ai/detectors/balanceInconsistencies";
import { detectDisputeNotMarked } from "@/lib/ai/detectors/disputeNotMarked";
import { detectDuplicateTradelines } from "@/lib/ai/detectors/duplicateTradelines";
import { detectObsoleteDebtAndReAging } from "@/lib/ai/detectors/obsoleteDebtReAging";
import {
  normalizeDetectorTradelines,
  type NormalizedDetectorTradeline,
} from "@/lib/ai/detectors/shared";
import { detectStatusDateInconsistencies } from "@/lib/ai/detectors/statusDateInconsistencies";
import type { DefectFinding, TradelineReviewInput } from "@/lib/types";

function dedupeFindings(findings: DefectFinding[]) {
  const map = new Map<string, DefectFinding>();

  findings.forEach((finding) => {
    const key = [
      finding.defectCode,
      finding.accountKey,
      finding.bureau,
      finding.reason,
    ].join(":");

    const existing = map.get(key);
    if (!existing || finding.score > existing.score || finding.confidence > existing.confidence) {
      map.set(key, finding);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => b.score - a.score || b.confidence - a.confidence || a.accountName.localeCompare(b.accountName),
  );
}

function groupTradelines(tradelines: NormalizedDetectorTradeline[]) {
  return tradelines.reduce<Map<string, NormalizedDetectorTradeline[]>>((map, tradeline) => {
    const current = map.get(tradeline.accountKey) ?? [];
    current.push(tradeline);
    map.set(tradeline.accountKey, current);
    return map;
  }, new Map());
}

export function detectDefectFindings(tradelines: TradelineReviewInput[]) {
  const normalized = normalizeDetectorTradelines(tradelines);
  const groups = groupTradelines(normalized);

  return dedupeFindings([
    ...detectBalanceInconsistencies(groups),
    ...detectDuplicateTradelines(groups),
    ...detectDisputeNotMarked(groups),
    ...detectObsoleteDebtAndReAging(normalized),
    ...detectStatusDateInconsistencies(normalized),
  ]);
}
