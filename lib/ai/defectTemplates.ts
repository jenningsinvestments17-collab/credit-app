import type { DefectFinding, DefectOutputTemplateKey } from "@/lib/types";

const defectOutputTemplates: Record<DefectOutputTemplateKey, (finding: DefectFinding) => string> = {
  balance_inconsistency: (finding) =>
    `${finding.accountName} shows balance reporting that appears inconsistent or unverifiable across the available bureau data.`,
  payment_history_inconsistency: (finding) =>
    `${finding.accountName} reflects payment-history reporting that conflicts with the rest of the account record.`,
  status_inconsistency: (finding) =>
    `${finding.accountName} appears to carry conflicting status reporting that should be reinvestigated and corrected.`,
  dispute_notation_missing: (finding) =>
    `${finding.accountName} appears to be disputed, but the required dispute notation is not consistently reflected in the bureau reporting.`,
  obsolete_debt: (finding) =>
    `${finding.accountName} appears to remain on file beyond the allowed reporting period and should be removed if obsolete.`,
  re_aging: (finding) =>
    `${finding.accountName} shows timing signals that may indicate improper re-aging or refreshed delinquency reporting.`,
  duplicate_reporting: (finding) =>
    `${finding.accountName} appears to be duplicated or double-reported in a way that may overstate the account impact.`,
  amount_misrepresented: (finding) =>
    `${finding.accountName} appears to reflect an amount that is inconsistent, unsupported, or misrepresented in the available reporting.`,
  fee_increase: (finding) =>
    `${finding.accountName} appears to include an unexplained increase that should be validated before it remains in the file.`,
  unverifiable_data: (finding) =>
    `${finding.accountName} includes core fields that are incomplete or unverifiable and should be reinvestigated.`,
  mixed_file: (finding) =>
    `${finding.accountName} includes indicators that may point to mixed-file reporting or another consumer’s data.`,
  date_inconsistency: (finding) =>
    `${finding.accountName} reflects inconsistent delinquency or activity dates that should be validated and corrected.`,
};

export function renderDefectOutputTemplate(finding: DefectFinding) {
  return defectOutputTemplates[finding.outputTemplateKey](finding);
}
