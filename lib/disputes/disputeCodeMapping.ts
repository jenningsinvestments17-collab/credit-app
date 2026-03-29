import type { TradelineReviewInput } from "@/lib/types";

function normalizeCodeKey(code: string) {
  return String(code || "").replace(/[^A-Z]/g, "");
}

export function getAllowedCodeMap(codes: string[]) {
  return codes.reduce<Record<string, string>>((accumulator, code) => {
    accumulator[normalizeCodeKey(code)] = code;
    return accumulator;
  }, {});
}

function includeCode(codeMap: Record<string, string>, codes: Set<string>, normalizedCode: string) {
  const exactCode = codeMap[normalizeCodeKey(normalizedCode)];
  if (exactCode) {
    codes.add(exactCode);
  }
}

function textIncludes(text: unknown, patterns: string[]) {
  const haystack = String(text || "").toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern.toLowerCase()));
}

export function mapTradelineToDisputeCodes(
  tradeline: TradelineReviewInput,
  allowedCodeMap: Record<string, string>,
) {
  const codes = new Set<string>();
  const rawData = JSON.stringify(tradeline.rawData ?? {}).toLowerCase();
  const status = String(tradeline.status || "").toLowerCase();
  const remarks = String(tradeline.remarks || "").toLowerCase();
  const paymentStatus = String(tradeline.paymentStatus || "").toLowerCase();
  const disputeComments = String(tradeline.disputeComments || "").toLowerCase();
  const balance = String(tradeline.balance || "").trim();
  const pastDue = String(tradeline.pastDue || "").trim();
  const dateOpened = String(tradeline.dateOpened || "").trim();

  if (!tradeline.accountName || !tradeline.accountNumberMask || !dateOpened) {
    includeCode(allowedCodeMap, codes, "NDOA");
  }

  if (!tradeline.remarks || !tradeline.paymentStatus || !balance || !dateOpened) {
    includeCode(allowedCodeMap, codes, "MF");
  }

  if (!tradeline.remarks && !remarks) {
    includeCode(allowedCodeMap, codes, "BRE");
  }

  if (!tradeline.status && !tradeline.paymentStatus) {
    includeCode(allowedCodeMap, codes, "BRA");
  }

  if (!dateOpened || !textIncludes(rawData, ["date of last activity", "dola"])) {
    includeCode(allowedCodeMap, codes, "MDLA");
  }

  if (!textIncludes(rawData, ["term", "duration", "months"])) {
    includeCode(allowedCodeMap, codes, "MTD");
  }

  if (!tradeline.furnisher) {
    includeCode(allowedCodeMap, codes, "MCC");
  }

  if (textIncludes(`${remarks} ${paymentStatus} ${disputeComments}`, ["contradict", "inconsistent"])) {
    includeCode(allowedCodeMap, codes, "CRPH");
  }

  if (
    (remarks.includes("late") && paymentStatus.includes("current")) ||
    (remarks.includes("current") && paymentStatus.includes("late")) ||
    (remarks.includes("charge") && paymentStatus.includes("current"))
  ) {
    includeCode(allowedCodeMap, codes, "PHR");
    includeCode(allowedCodeMap, codes, "CRPH");
  }

  if (
    (status.includes("closed") && (paymentStatus.includes("late") || Boolean(pastDue))) ||
    (status.includes("paid") && Boolean(pastDue))
  ) {
    includeCode(allowedCodeMap, codes, "IDCPH");
  }

  if (textIncludes(rawData, ["x", "n/a", "blank", "no data"])) {
    includeCode(allowedCodeMap, codes, "XND");
  }

  if (textIncludes(rawData, ["re-aged", "reaged"])) {
    includeCode(allowedCodeMap, codes, "RE");
  }

  if (textIncludes(rawData, ["never late"]) && (remarks.includes("late") || paymentStatus.includes("late") || Boolean(pastDue))) {
    includeCode(allowedCodeMap, codes, "NL");
  }

  if (textIncludes(disputeComments, ["payment received inaccurate", "incorrect payment"])) {
    includeCode(allowedCodeMap, codes, "IPR");
  }

  if (status.includes("charge") && (textIncludes(rawData, ["credit limit"]) || textIncludes(remarks, ["credit limit"]))) {
    includeCode(allowedCodeMap, codes, "CLCA");
    includeCode(allowedCodeMap, codes, "CL");
  }

  if ((status.includes("charge") || status.includes("collection")) && Boolean(pastDue)) {
    includeCode(allowedCodeMap, codes, "PDC");
  }

  if (status.includes("charge") && (Boolean(balance) || Boolean(pastDue) || paymentStatus.includes("pay"))) {
    includeCode(allowedCodeMap, codes, "CCOFR");
  }

  if (textIncludes(rawData, ["high balance"])) {
    includeCode(allowedCodeMap, codes, "HB");
  }

  if (balance) {
    includeCode(allowedCodeMap, codes, "B");
  }

  if (!dateOpened || !textIncludes(rawData, ["opened", "open date"])) {
    includeCode(allowedCodeMap, codes, "OP");
  }

  if (textIncludes(rawData, ["repeated late"])) {
    includeCode(allowedCodeMap, codes, "RLM");
  }

  if (textIncludes(rawData, ["repeated payment"])) {
    includeCode(allowedCodeMap, codes, "RP");
  }

  if (textIncludes(rawData, ["repeated balance"])) {
    includeCode(allowedCodeMap, codes, "RB");
  }

  if (textIncludes(rawData, ["no recent payment"]) || (!paymentStatus && Boolean(pastDue))) {
    includeCode(allowedCodeMap, codes, "NRP");
  }

  if (!codes.size) {
    includeCode(allowedCodeMap, codes, "NDOA");
    includeCode(allowedCodeMap, codes, "MF");
  }

  return Array.from(codes);
}
