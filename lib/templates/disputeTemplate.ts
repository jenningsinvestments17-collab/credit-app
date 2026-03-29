import fs from "node:fs";
import path from "node:path";
import { renderDefectOutputTemplate } from "@/lib/ai/defectTemplates";
import { buildOutputDisclaimerBlock } from "@/lib/compliance/disclaimers";
import { applyContentGuardrails } from "@/lib/compliance/guardrails";
import { getAllowedCodeMap, mapTradelineToDisputeCodes } from "@/lib/disputes/disputeCodeMapping";
import type { Bureau, DefectCode, DefectFinding, Lead } from "@/lib/types";

type DisputeTemplateData = {
  lead: Lead;
  bureauName: Bureau;
  findings: DefectFinding[];
};

const TEMPLATE_PATHS = [
  path.join(process.cwd(), "..", "dispute_template.txt"),
  path.join(process.cwd(), "..", "templates", "dispute_template.txt"),
];

const fallbackDefectCodeToDisputeCodes: Record<DefectCode, string[]> = {
  inconsistent_balance: ["CRPH", "B", "RB"],
  inconsistent_payment_history: ["PHR", "RLM", "RP"],
  inconsistent_status: ["CRPH", "BRA", "IDCPH"],
  dispute_not_marked: ["BRE", "MF"],
  obsolete_debt: ["MDLA", "RE"],
  suspected_re_aging: ["RE", "MDLA"],
  duplicate_tradeline: ["MF", "CRPH"],
  amount_misrepresented: ["B", "PDC", "CLCA"],
  status_misrepresented: ["BRA", "CRPH", "IDCPH"],
  unexplained_fee_increase: ["B", "HB"],
  unverifiable_account_data: ["NDOA", "MF", "XND"],
  transfer_sale_double_reporting: ["MF", "CRPH"],
  mixed_file_issue: ["NDOA", "MF"],
  inconsistent_delinquency_activity_dates: ["MDLA", "OP"],
};

function loadTemplateText() {
  for (const templatePath of TEMPLATE_PATHS) {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf8");
    }
  }

  throw new Error("No dispute template file was found.");
}

export function extractDisputeCodes(template: string) {
  const matches = [...template.matchAll(/\(([^)]+)\)/g)];
  const codes = new Set<string>();

  for (const match of matches) {
    const value = (match[1] || "").trim();
    if (!value || value.includes("{{") || value.length > 20) {
      continue;
    }

    if (/[A-Z]{2,}/.test(value)) {
      codes.add(value);
    }
  }

  return Array.from(codes);
}

function normalizeText(value: string | undefined, fallback: string) {
  const text = value?.trim();
  return text?.length ? text : fallback;
}

function formatTemplateDate() {
  return new Date().toLocaleDateString("en-US");
}

function getClientAddress(_lead: Lead) {
  return "Address not yet stored in this preview environment.";
}

function getClientDob(_lead: Lead) {
  return "DOB not yet stored in this preview environment.";
}

function getClientSsnLast4(_lead: Lead) {
  return "SSN last 4 not yet stored in this preview environment.";
}

function buildAccountsSection(findings: DefectFinding[], allowedCodes: string[]) {
  if (!findings.length) {
    return [
      "Account 1",
      "Bureau: No bureau findings parsed yet.",
      "Furnisher: Not yet extracted from uploaded reports.",
      "Account: No structured tradeline has been finalized yet.",
      "Codes: NDOA; MF",
      "Explanation: The current file still needs full structured tradeline extraction before final dispute drafting.",
    ].join("\n");
  }

  const allowedSet = new Set(allowedCodes);
  const allowedCodeMap = getAllowedCodeMap(allowedCodes);

  return findings
    .map((finding, index) => {
      const mappedCodes = finding.tradelineData
        ? mapTradelineToDisputeCodes(finding.tradelineData, allowedCodeMap)
        : fallbackDefectCodeToDisputeCodes[finding.defectCode].filter((code) => allowedSet.has(code));
      const disputeCodes = mappedCodes.length ? mappedCodes : ["NDOA", "MF"];

      finding.disputeCodes = disputeCodes;

      return [
        `Account ${index + 1}`,
        `Bureau: ${finding.bureau}`,
        `Furnisher: ${finding.tradelineData?.furnisher ?? finding.accountName}`,
        `Account: ${finding.accountName} (${finding.accountLast4})`,
        `Codes: ${disputeCodes.join("; ")}`,
        `Explanation: ${renderDefectOutputTemplate(finding)} ${finding.reason} Balance: ${finding.tradelineData?.balance ?? "Not provided in current file."}. Status: ${finding.tradelineData?.status ?? "Not provided in current file."}. Remarks: ${finding.tradelineData?.remarks ?? "Not provided in current file."}. Payment Status: ${finding.tradelineData?.paymentStatus ?? "Not provided in current file."}. Past Due: ${finding.tradelineData?.pastDue ?? "Not provided in current file."}. Date Opened: ${finding.tradelineData?.dateOpened ?? "Not provided in current file."}.`,
      ].join("\n");
    })
    .join("\n------------------------------------------------------------\n");
}

export function renderDisputeTemplate(data: DisputeTemplateData) {
  const template = loadTemplateText();
  const allowedCodes = extractDisputeCodes(template);
  const accountsSection = buildAccountsSection(data.findings, allowedCodes);

  const rendered = template
    .replace(/{{DATE}}/g, formatTemplateDate())
    .replace(/{{FULL_NAME}}/g, normalizeText(data.lead.fullName, "Client Name Not Provided"))
    .replace(/{{ADDRESS}}/g, getClientAddress(data.lead))
    .replace(/{{DOB}}/g, getClientDob(data.lead))
    .replace(/{{SSN_LAST4}}/g, getClientSsnLast4(data.lead))
    .replace(/{{NAME_VARIATIONS}}/g, "No structured name-variation list extracted yet.")
    .replace(/{{REPORTED_ADDRESSES}}/g, "No structured reported-address list extracted yet.")
    .replace(
      /{{ADDRESS_CONTRADICTION}}/g,
      "Compare each reported address against the client address above and delete any inaccurate, incomplete, inconsistent, or unverifiable address.",
    )
    .replace(/{{ACCOUNTS_SECTION}}/g, accountsSection)
    .replace(/Experian lists/g, `${data.bureauName} lists`);

  return applyContentGuardrails(
    `${rendered}\n\n${buildOutputDisclaimerBlock()}`,
  );
}
