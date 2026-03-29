import type { Bureau, DefectCode, TradelineReviewInput } from "@/lib/types";

function cleanValue(value: string) {
  return value.trim();
}

function extractField(block: string, label: string) {
  const match = block.match(new RegExp(`${label}:\\s*(.+)`, "i"));
  return match ? cleanValue(match[1]) : "";
}

function buildRawData(block: string) {
  const raw: Record<string, unknown> = {};
  const lower = block.toLowerCase();

  if (lower.includes("date of last activity")) raw["date of last activity"] = true;
  if (lower.includes("term")) raw.term = true;
  if (lower.includes("duration")) raw.duration = true;
  if (lower.includes("credit limit")) raw["credit limit"] = true;
  if (lower.includes("high balance")) raw["high balance"] = true;
  if (lower.includes("repeated payment")) raw["repeated payment"] = true;
  if (lower.includes("repeated balance")) raw["repeated balance"] = true;
  if (lower.includes("repeated late")) raw["repeated late"] = true;
  if (lower.includes("never late")) raw["never late"] = true;
  if (lower.includes("blank")) raw.blank = true;
  if (lower.includes("no data")) raw["no data"] = true;
  if (lower.includes("re-aged") || lower.includes("reaged")) raw["re-aged"] = true;

  return raw;
}

function normalizeExperianText(extractedText: string) {
  return extractedText
    .replace(/\r/g, "\n")
    .replace(/2\/\d+\/\d+,\s+\d+:\d+\s+[AP]M[\s\S]*?https:\/\/usa\.experian\.com\/acr\/printReport\?type=CDI\s+\d+\/\d+/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n");
}

function extractExperianField(block: string, label: string, nextLabels: string[]) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nextPattern = nextLabels
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(
    `${escapedLabel}\\s+([\\s\\S]*?)(?=\\n(?:${nextPattern})\\b|$)`,
    "i",
  );
  const match = block.match(regex);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function parseExperianTradelines(extractedText: string, bureau: Bureau) {
  const normalized = normalizeExperianText(extractedText);
  const accountStarts = [...normalized.matchAll(/\nAccount Name\s+([^\n]+)/g)];

  const parsed: Array<TradelineReviewInput | null> = accountStarts
    .map((match, index) => {
      const start = match.index ?? 0;
      const end = accountStarts[index + 1]?.index ?? normalized.length;
      const block = normalized.slice(start, end).trim();

      const accountName = extractExperianField(block, "Account Name", [
        "Account Number",
      ]);

      if (!accountName) {
        return null;
      }

      const accountNumberMask = extractExperianField(block, "Account Number", [
        "Account Type",
      ]);
      const responsibility = extractExperianField(block, "Responsibility", [
        "Date Opened",
      ]);
      const dateOpened = extractExperianField(block, "Date Opened", ["Status"]);
      const status = extractExperianField(block, "Status", ["Status Updated"]);
      const balance = extractExperianField(block, "Balance", ["Balance Updated"]);
      const paymentStatus = extractExperianField(block, "Recent Payment", [
        "Monthly Payment",
      ]);
      const monthlyPayment = extractExperianField(block, "Monthly Payment", [
        "Credit Limit",
      ]);
      const creditLimit = extractExperianField(block, "Credit Limit", [
        "Highest Balance",
      ]);
      const highestBalance = extractExperianField(block, "Highest Balance", [
        "Terms",
      ]);
      const terms = extractExperianField(block, "Terms", [
        "On Record Until",
        "Payment History",
        "Balance Histories",
        "Additional info",
      ]);
      const additionalInfo = extractExperianField(block, "Additional info", [
        "Contact Info",
        "Comment",
        "Reinvestigation Info",
      ]);
      const comment = extractExperianField(block, "Comment", [
        "Reinvestigation Info",
        "Account Name",
      ]);

      return {
        bureau,
        furnisher: accountName,
        accountName,
        accountNumberMask,
        balance,
        status,
        remarks: [responsibility, comment, additionalInfo].filter(Boolean).join(" | "),
        paymentStatus: [paymentStatus, monthlyPayment].filter(Boolean).join(" | "),
        pastDue: (() => {
          const matchPastDue = status.match(/\$[\d,]+ past due/i);
          return matchPastDue ? matchPastDue[0] : "";
        })(),
        disputeComments: comment,
        dateOpened,
        rawData: {
          responsibility,
          terms,
          "credit limit": creditLimit,
          "high balance": highestBalance,
          comment,
          additionalInfo,
          rawBlock: block,
          ...buildRawData(block),
        },
      } satisfies TradelineReviewInput;
    });

  return parsed.filter((item): item is TradelineReviewInput => item !== null);
}

export function parseTradelineRecords(
  extractedText: string | undefined,
  bureau: Bureau,
): TradelineReviewInput[] {
  if (!extractedText?.trim()) {
    return [];
  }

  if (bureau === "Experian" && extractedText.includes("Account Name")) {
    return parseExperianTradelines(extractedText, bureau);
  }

  const blocks = extractedText
    .split(/\n\s*---+\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const parsed: Array<TradelineReviewInput | null> = blocks.map((block) => {
      const accountName = extractField(block, "Account");
      const accountNumberMask = extractField(block, "Account Number");

      if (!accountName && !accountNumberMask) {
        return null;
      }

      return {
        bureau,
        furnisher: extractField(block, "Furnisher"),
        accountName,
        accountNumberMask,
        balance: extractField(block, "Balance"),
        status: extractField(block, "Status"),
        remarks: extractField(block, "Remarks"),
        paymentStatus: extractField(block, "Payment Status"),
        pastDue: extractField(block, "Past Due"),
        disputeComments: extractField(block, "Dispute Comments"),
        dateOpened: extractField(block, "Date Opened"),
        rawData: buildRawData(block),
      } satisfies TradelineReviewInput;
    });

  return parsed.filter((item): item is TradelineReviewInput => item !== null);
}

export function inferPrimaryDefectCode(tradeline: TradelineReviewInput): DefectCode {
  const status = String(tradeline.status || "").toLowerCase();
  const remarks = String(tradeline.remarks || "").toLowerCase();
  const paymentStatus = String(tradeline.paymentStatus || "").toLowerCase();
  const raw = JSON.stringify(tradeline.rawData ?? {}).toLowerCase();

  if (!tradeline.accountName || !tradeline.accountNumberMask || !tradeline.dateOpened) {
    return "unverifiable_account_data";
  }

  if (remarks.includes("duplicate")) {
    return "duplicate_tradeline";
  }

  if (raw.includes("re-aged") || raw.includes("reaged")) {
    return "suspected_re_aging";
  }

  if (
    remarks.includes("contradiction") ||
    remarks.includes("inconsistent") ||
    paymentStatus.includes("current")
  ) {
    return "inconsistent_balance";
  }

  if (status.includes("mixed") || remarks.includes("mixed")) {
    return "mixed_file_issue";
  }

  if (remarks.includes("dispute notation")) {
    return "dispute_not_marked";
  }

  return "unverifiable_account_data";
}

export function summarizeParsedReport(
  parsedTradelines: TradelineReviewInput[],
  bureau: Bureau,
) {
  if (!parsedTradelines.length) {
    return `${bureau} report uploaded but no tradelines were parsed yet.`;
  }

  return `${bureau} report parsed into ${parsedTradelines.length} tradeline${
    parsedTradelines.length === 1 ? "" : "s"
  } for review.`;
}
