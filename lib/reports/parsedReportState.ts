import fs from "node:fs";
import path from "node:path";
import type { Bureau, BureauReportRecord, RequiredDocumentKey } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), ".data", "parsed-report-state.json");

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function readStore(): BureauReportRecord[] {
  ensureStoreDir();

  if (!fs.existsSync(STORE_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as BureauReportRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(records: BureauReportRecord[]) {
  ensureStoreDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), "utf8");
}

export function listParsedReportRecords() {
  return readStore();
}

export function getParsedReportRecord(
  leadId: string,
  documentKey: RequiredDocumentKey,
) {
  return readStore().find(
    (record) => record.leadId === leadId && record.documentKey === documentKey,
  ) ?? null;
}

export function getParsedReportRecordByBureau(leadId: string, bureau: Bureau) {
  return readStore().find(
    (record) => record.leadId === leadId && record.bureau === bureau,
  ) ?? null;
}

export function getParsedReportRecordsByLead(leadId: string) {
  return readStore().filter((record) => record.leadId === leadId);
}

export function saveParsedReportRecord(record: BureauReportRecord) {
  const existing = readStore().filter(
    (item) => !(item.leadId === record.leadId && item.documentKey === record.documentKey),
  );
  existing.push(record);
  writeStore(existing);
  return record;
}
