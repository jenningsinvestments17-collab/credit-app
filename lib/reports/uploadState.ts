import fs from "node:fs";
import path from "node:path";
import type { RequiredDocumentKey } from "@/lib/types";

export type UploadedReportRecord = {
  leadId: string;
  documentKey: RequiredDocumentKey;
  originalFilename: string;
  storagePath: string;
  uploadedAt: string;
};

const STORE_PATH = path.join(process.cwd(), ".data", "report-upload-state.json");

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function readStore(): UploadedReportRecord[] {
  ensureStoreDir();

  if (!fs.existsSync(STORE_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as UploadedReportRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(records: UploadedReportRecord[]) {
  ensureStoreDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), "utf8");
}

export function listUploadedReportRecords() {
  return readStore();
}

export function getUploadedReportRecord(
  leadId: string,
  documentKey: RequiredDocumentKey,
) {
  return readStore().find(
    (record) => record.leadId === leadId && record.documentKey === documentKey,
  ) ?? null;
}

export function getUploadedReportRecordsByLead(leadId: string) {
  return readStore().filter((record) => record.leadId === leadId);
}

export function saveUploadedReportRecord(record: UploadedReportRecord) {
  const existing = readStore().filter(
    (item) => !(item.leadId === record.leadId && item.documentKey === record.documentKey),
  );
  existing.push(record);
  writeStore(existing);
  return record;
}
