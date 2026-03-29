import fs from "node:fs";
import path from "node:path";
import type { DocumentRecord, RequiredDocumentKey } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), ".data", "document-state.json");

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function readStore(): DocumentRecord[] {
  ensureStoreDir();

  if (!fs.existsSync(STORE_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as DocumentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(records: DocumentRecord[]) {
  ensureStoreDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), "utf8");
}

export function listDocumentRecords() {
  return readStore();
}

export function getDocumentRecord(leadId: string, key: RequiredDocumentKey) {
  return readStore().find((record) => record.leadId === leadId && record.key === key) ?? null;
}

export function getDocumentRecordsByLead(leadId: string) {
  return readStore().filter((record) => record.leadId === leadId);
}

export function saveDocumentRecord(record: DocumentRecord) {
  const existing = readStore().filter(
    (item) => !(item.leadId === record.leadId && item.key === record.key),
  );
  existing.push(record);
  writeStore(existing);
  return record;
}
