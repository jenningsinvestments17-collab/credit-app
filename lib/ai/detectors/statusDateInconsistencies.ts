import type { DefectFinding } from "@/lib/types";
import { createDefectFinding, type NormalizedDetectorTradeline } from "@/lib/ai/detectors/shared";

export function detectStatusDateInconsistencies(tradelines: NormalizedDetectorTradeline[]) {
  const findings: DefectFinding[] = [];

  tradelines.forEach((tradeline) => {
    const contradictionStatus =
      (tradeline.statusText.includes("closed") && (tradeline.pastDueNumber ?? 0) > 0) ||
      (tradeline.statusText.includes("current") && tradeline.remarksText.includes("late")) ||
      (tradeline.statusText.includes("charge") && tradeline.remarksText.includes("current"));

    if (contradictionStatus) {
      findings.push(
        createDefectFinding({
          defectCode: "status_misrepresented",
          tradeline,
          reason: "The account status conflicts with past due or remark indicators.",
          confidence: 0.86,
          score: 24,
          supportingFacts: [
            `Status: ${tradeline.status || "not shown"}`,
            `Past due: ${tradeline.pastDue || "not shown"}`,
            `Remarks: ${tradeline.remarks || "not shown"}`,
          ],
        }),
      );
    }

    if (
      tradeline.statusText.includes("current") &&
      tradeline.paymentStatus?.toLowerCase().includes("late")
    ) {
      findings.push(
        createDefectFinding({
          defectCode: "inconsistent_payment_history",
          tradeline,
          reason: "Payment-history text conflicts with the current-status representation.",
          confidence: 0.83,
          score: 20,
          supportingFacts: [
            `Status: ${tradeline.status || "not shown"}`,
            `Payment status: ${tradeline.paymentStatus || "not shown"}`,
          ],
        }),
      );
    }

    if (!tradeline.dateOpenedDate || !tradeline.rawText.includes("date of last activity")) {
      findings.push(
        createDefectFinding({
          defectCode: "inconsistent_delinquency_activity_dates",
          tradeline,
          reason: "Critical activity or delinquency dates are incomplete or inconsistent in the tradeline data.",
          confidence: 0.76,
          score: 18,
          supportingFacts: [
            `Date opened: ${tradeline.dateOpened || "not shown"}`,
            `Status: ${tradeline.status || "not shown"}`,
          ],
        }),
      );
    }

    const mixedFileSignals = `${tradeline.remarksText} ${tradeline.rawText}`;
    if (mixedFileSignals.includes("mixed") || mixedFileSignals.includes("not mine")) {
      findings.push(
        createDefectFinding({
          defectCode: "mixed_file_issue",
          tradeline,
          reason: "The tradeline includes identity-mixing indicators that should be treated as a mixed-file risk.",
          confidence: 0.82,
          score: 26,
          supportingFacts: [
            `Remarks: ${tradeline.remarks || "not shown"}`,
            `Account name: ${tradeline.accountName || tradeline.furnisher || "unknown"}`,
          ],
        }),
      );
    }

    if (!tradeline.accountName || !tradeline.accountNumberMask || !tradeline.dateOpened) {
      findings.push(
        createDefectFinding({
          defectCode: "unverifiable_account_data",
          tradeline,
          reason: "Core identifying fields are incomplete, making the account difficult to verify cleanly.",
          confidence: 0.75,
          score: 14,
          supportingFacts: [
            `Account name: ${tradeline.accountName || "missing"}`,
            `Account number: ${tradeline.accountNumberMask || "missing"}`,
            `Date opened: ${tradeline.dateOpened || "missing"}`,
          ],
        }),
      );
    }

    if (
      tradeline.balanceNumber !== undefined &&
      tradeline.pastDueNumber !== undefined &&
      tradeline.balanceNumber < tradeline.pastDueNumber
    ) {
      findings.push(
        createDefectFinding({
          defectCode: "amount_misrepresented",
          tradeline,
          reason: "The reported past due amount exceeds the full balance, which suggests an amount inconsistency.",
          confidence: 0.81,
          score: 20,
          supportingFacts: [
            `Balance: ${tradeline.balance || "not shown"}`,
            `Past due: ${tradeline.pastDue || "not shown"}`,
          ],
        }),
      );
    }

    if (tradeline.rawText.includes("fee") && tradeline.balanceNumber !== undefined && tradeline.balanceNumber > 0) {
      findings.push(
        createDefectFinding({
          defectCode: "unexplained_fee_increase",
          tradeline,
          reason: "The tradeline appears to reflect a fee-driven increase without a clear supporting explanation.",
          confidence: 0.7,
          score: 12,
          supportingFacts: [
            `Balance: ${tradeline.balance || "not shown"}`,
            `Raw report notes contain fee references.`,
          ],
        }),
      );
    }

    if (
      tradeline.statusText.includes("charged off") &&
      tradeline.balanceNumber !== undefined &&
      tradeline.balanceNumber > 0 &&
      tradeline.remarksText.includes("closed")
    ) {
      findings.push(
        createDefectFinding({
          defectCode: "inconsistent_status",
          tradeline,
          reason: "The charge-off and closure indicators do not align cleanly with the rest of the account state.",
          confidence: 0.8,
          score: 16,
          supportingFacts: [
            `Status: ${tradeline.status || "not shown"}`,
            `Remarks: ${tradeline.remarks || "not shown"}`,
          ],
        }),
      );
    }
  });

  return findings;
}
