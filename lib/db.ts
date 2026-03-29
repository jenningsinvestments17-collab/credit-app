import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllLeads } from "@/lib/leads";
import type {
  DisputeRecord,
  DisputeVersionRecord,
  DomainEvent,
  EventProcessingLogRecord,
  MailingEventRecord,
  MailingJobRecord,
  MailingPipelineStore,
  PaymentRecord,
} from "@/lib/types";

// The local JSON store remains the lightweight dev/runtime fallback for the
// current prototype. The normalized PostgreSQL source of truth for the full
// product lifecycle now lives in sql/migrations/003_product_lifecycle_schema.sql.
export type DbAdapter = {
  query?: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "mailing-pipeline.json");

function isoNow() {
  return new Date().toISOString();
}

function buildSeedStore(): MailingPipelineStore {
  const leads = getAllLeads();
  const disputes: DisputeRecord[] = [];
  const disputeVersions: DisputeVersionRecord[] = [];
  const mailingJobs: MailingJobRecord[] = [];
  const mailingEvents: MailingEventRecord[] = [];
  const paymentRecords: PaymentRecord[] = [];
  const domainEvents: DomainEvent[] = [];
  const eventProcessingLog: EventProcessingLogRecord[] = [];

  for (const lead of leads) {
    if (!lead.disputeDraft) continue;

    const disputeId = `dispute_${lead.id}`;
    const versionId = `dispver_${lead.id}_1`;

    disputes.push({
      id: disputeId,
      leadId: lead.id,
      bureau: lead.disputeDraft.bureau,
      currentVersionId: versionId,
      processingStatus:
        lead.disputeDraft.status === "mailed"
          ? "service_rendered"
          : lead.disputeDraft.status === "approved"
            ? "approved"
            : "awaiting_admin_review",
      workflowStatus:
        lead.disputeDraft.status === "mailed"
          ? "tracking_pending"
          : lead.disputeDraft.status === "approved"
            ? "approved_pending_pdf"
            : "awaiting_admin_approval",
      approvedAt: lead.disputeDraft.approvedAt,
      approvedBy: lead.disputeDraft.approvedBy,
      paidAt: lead.disputeDraft.status === "mailed" ? "2026-03-24T13:40:00.000Z" : undefined,
      readyToSendAt:
        lead.disputeDraft.status === "mailed" ? "2026-03-24T13:42:00.000Z" : undefined,
      sentToProviderAt:
        lead.disputeDraft.status === "mailed" ? "2026-03-24T14:00:00.000Z" : undefined,
      createdAt: lead.disputeDraft.generatedAt,
      updatedAt: lead.updatedAt,
    });

    disputeVersions.push({
      id: versionId,
      disputeId,
      versionNumber: 1,
      kind: lead.disputeDraft.approvedAt ? "mailing_final" : "ai_draft",
      letterText: lead.disputeDraft.letterText,
      summary: lead.disputeDraft.summary,
      findings: lead.disputeDraft.findings,
      generatedBy: lead.disputeDraft.approvedAt ? "admin" : "ai",
      createdAt: lead.disputeDraft.generatedAt,
      approvedAt: lead.disputeDraft.approvedAt,
      pdfAssetPath: lead.disputeDraft.status === "mailed" ? `/generated/${versionId}.pdf` : undefined,
      pdfGeneratedAt:
        lead.disputeDraft.status === "mailed" ? "2026-03-24T13:35:00.000Z" : undefined,
      notes: lead.disputeDraft.adminReviewNotes ?? [],
    });

    if (lead.certifiedMailPacket) {
      mailingJobs.push({
        id: `mailjob_${lead.id}`,
        disputeId,
        leadId: lead.id,
        bureau: lead.certifiedMailPacket.disputeBureau,
        workflowStatus: "tracking_pending",
        providerStatus: lead.certifiedMailPacket.trackingNumber ? "tracking_received" : "submitted",
        queuedAt: lead.certifiedMailPacket.queuedAt,
        sentToProviderAt: lead.certifiedMailPacket.processedAt,
        trackingNumber: lead.certifiedMailPacket.trackingNumber,
        proofOfMailingPath: lead.certifiedMailPacket.proofOfMailing,
        signedReturnReceiptStatus: lead.certifiedMailPacket.signedReturnReceiptStatus,
        signedReturnReceiptPath: lead.certifiedMailPacket.signedReturnReceiptPath,
        signedReturnReceiptReceivedAt: lead.certifiedMailPacket.signedReturnReceiptReceivedAt,
        signedReturnReceiptSigner: lead.certifiedMailPacket.signedReturnReceiptSigner,
        deliveryStatus: lead.certifiedMailPacket.deliveryStatus,
        deliveredAt: lead.certifiedMailPacket.deliveredAt,
        createdAt: lead.certifiedMailPacket.queuedAt ?? lead.updatedAt,
        updatedAt: lead.updatedAt,
      });

      paymentRecords.push({
        id: `payment_${lead.id}`,
        disputeId,
        leadId: lead.id,
        amountCents: 40500,
        currency: "usd",
        status: "captured",
        stripePaymentIntentId: `pi_${lead.id}`,
        stripeCheckoutSessionId: `cs_${lead.id}`,
        checkoutUrl: `/dashboard?mailingPayment=${disputeId}&status=authorized`,
        updatePaymentMethodUrl: `/dashboard?mailingPayment=${disputeId}&status=payment_required`,
        requestedAt: "2026-03-24T13:32:00.000Z",
        confirmedAt: "2026-03-24T13:39:00.000Z",
        authorizedAt: "2026-03-24T13:35:00.000Z",
        authorizationExpiresAt: "2026-03-31T13:35:00.000Z",
        capturedAt: "2026-03-24T13:39:00.000Z",
        retryCount: 0,
        clientActionRequired: false,
        createdAt: "2026-03-24T13:32:00.000Z",
        updatedAt: "2026-03-24T13:39:00.000Z",
      });

      mailingEvents.push(
        {
          id: `event_${lead.id}_approved`,
          disputeId,
          mailingJobId: `mailjob_${lead.id}`,
          eventType: "approved",
          occurredAt: lead.disputeDraft.approvedAt ?? isoNow(),
          actor: lead.disputeDraft.approvedBy ?? "Admin reviewer",
          notes: "Dispute approved for mailing.",
        },
        {
          id: `event_${lead.id}_payment`,
          disputeId,
          mailingJobId: `mailjob_${lead.id}`,
          eventType: "payment_confirmed",
          occurredAt: "2026-03-24T13:39:00.000Z",
          actor: "Stripe webhook",
          notes: "Payment confirmed for mailing workflow.",
        },
        {
          id: `event_${lead.id}_sent`,
          disputeId,
          mailingJobId: `mailjob_${lead.id}`,
          eventType: "sent_to_provider",
          occurredAt: "2026-03-24T14:00:00.000Z",
          actor: "Certified mail provider",
          notes: "Mailing job accepted by provider.",
        },
      );
    }
  }

  return {
    disputes,
    disputeVersions,
    mailingJobs,
    mailingEvents,
    paymentRecords,
    domainEvents,
    eventProcessingLog,
  };
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    const seed = buildSeedStore();
    await writeFile(STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
  }
}

export async function readMailingPipelineStore(): Promise<MailingPipelineStore> {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<MailingPipelineStore>;
  return {
    disputes: parsed.disputes ?? [],
    disputeVersions: parsed.disputeVersions ?? [],
    mailingJobs: parsed.mailingJobs ?? [],
    mailingEvents: parsed.mailingEvents ?? [],
    paymentRecords: parsed.paymentRecords ?? [],
    domainEvents: parsed.domainEvents ?? [],
    eventProcessingLog: parsed.eventProcessingLog ?? [],
  };
}

export async function writeMailingPipelineStore(store: MailingPipelineStore) {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function mutateMailingPipelineStore(
  mutator: (store: MailingPipelineStore) => MailingPipelineStore,
) {
  const store = await readMailingPipelineStore();
  const nextStore = mutator(store);
  await writeMailingPipelineStore(nextStore);
  return nextStore;
}

export const db: DbAdapter = {
  // PostgreSQL integration point:
  // register a Pool-backed adapter here when DATABASE_URL and pg are introduced.
};
