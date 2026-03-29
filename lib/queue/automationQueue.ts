import { getRedisClient } from "@/lib/db/redis";
import { recordDurationMetric, recordOpsError, incrementOpsCounter } from "@/lib/monitoring/ops";

export type AutomationJobType =
  | "document_validation"
  | "report_extraction"
  | "ai_generation"
  | "pdf_generation"
  | "mailing_submission"
  | "tracking_reconciliation";

export type AutomationJobPayload = {
  leadId?: string;
  disputeId?: string;
  documentKey?: string;
  documentId?: string;
  reportId?: string;
  paymentId?: string;
  mailingJobId?: string;
  providerEventType?: string;
  trackingNumber?: string;
  [key: string]: unknown;
};

export type AutomationJobStatus = "pending" | "processing" | "completed" | "failed" | "dead_letter";

export type AutomationJob = {
  id: string;
  type: AutomationJobType;
  payload: AutomationJobPayload;
  dedupeKey?: string;
  status: AutomationJobStatus;
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  scheduledFor?: string;
  processedAt?: string;
  failedAt?: string;
  lastError?: string;
  updatedAt: string;
};

const PREFIX = "queue:automation";
const ALL_JOBS_KEY = `${PREFIX}:all`;

function jobKey(id: string) {
  return `${PREFIX}:job:${id}`;
}

function scheduleKey(type: AutomationJobType) {
  return `${PREFIX}:scheduled:${type}`;
}

function statusSetKey(status: AutomationJobStatus) {
  return `${PREFIX}:status:${status}`;
}

function dedupeKey(key: string) {
  return `${PREFIX}:dedupe:${key}`;
}

function lockKey(id: string) {
  return `${PREFIX}:lock:${id}`;
}

async function getRedis() {
  const redis = getRedisClient();
  await redis.connect().catch(() => null);
  return redis;
}

function getBackoffMs(attempt: number) {
  const base = 30_000;
  return Math.min(base * Math.pow(2, Math.max(0, attempt - 1)), 15 * 60_000);
}

async function saveJob(job: AutomationJob) {
  const redis = await getRedis();
  const multi = redis.multi();
  const serialized = JSON.stringify(job);
  multi.set(jobKey(job.id), serialized);
  multi.zadd(ALL_JOBS_KEY, Date.parse(job.queuedAt), job.id);
  (["pending", "processing", "completed", "failed", "dead_letter"] as AutomationJobStatus[]).forEach((status) => {
    multi.srem(statusSetKey(status), job.id);
  });
  multi.sadd(statusSetKey(job.status), job.id);

  if (job.status === "pending" || job.status === "failed") {
    multi.zadd(scheduleKey(job.type), Date.parse(job.scheduledFor ?? job.queuedAt), job.id);
  } else {
    multi.zrem(scheduleKey(job.type), job.id);
  }

  if (job.dedupeKey && (job.status === "pending" || job.status === "processing" || job.status === "completed")) {
    multi.set(dedupeKey(job.dedupeKey), job.id, "EX", 60 * 60 * 24 * 14);
  }

  await multi.exec();
}

async function readJob(id: string) {
  const redis = await getRedis();
  const raw = await redis.get(jobKey(id));
  return raw ? (JSON.parse(raw) as AutomationJob) : null;
}

export function buildAutomationJob(input: {
  id: string;
  type: AutomationJobType;
  payload: AutomationJobPayload;
  dedupeKey?: string;
  status?: AutomationJobStatus;
  attempts?: number;
  maxAttempts?: number;
  queuedAt?: string;
  scheduledFor?: string;
  processedAt?: string;
  failedAt?: string;
  lastError?: string;
  updatedAt?: string;
}) {
  const now = input.queuedAt ?? new Date().toISOString();
  return {
    id: input.id,
    type: input.type,
    payload: input.payload,
    dedupeKey: input.dedupeKey,
    status: input.status ?? "pending",
    attempts: input.attempts ?? 0,
    maxAttempts: input.maxAttempts ?? 5,
    queuedAt: now,
    scheduledFor: input.scheduledFor,
    processedAt: input.processedAt,
    failedAt: input.failedAt,
    lastError: input.lastError,
    updatedAt: input.updatedAt ?? now,
  } satisfies AutomationJob;
}

export async function queueAutomationJob(job: AutomationJob) {
  if (job.dedupeKey) {
    const redis = await getRedis();
    const existingId = await redis.get(dedupeKey(job.dedupeKey));
    if (existingId) {
      const existing = await readJob(existingId);
      if (existing && ["pending", "processing", "completed"].includes(existing.status)) {
        return existing;
      }
    }
  }

  await saveJob(job);
  await incrementOpsCounter(`automation.${job.type}.queued`);
  return job;
}

export async function updateAutomationJob(job: AutomationJob) {
  await saveJob(job);
  return job;
}

async function claimDueJobIds(type: AutomationJobType, limit: number) {
  const redis = await getRedis();
  const ids = await redis.zrangebyscore(scheduleKey(type), 0, Date.now(), "LIMIT", 0, limit);
  const claimed: string[] = [];
  for (const id of ids) {
    const locked = await redis.set(lockKey(id), String(Date.now()), "EX", 120, "NX");
    if (locked === "OK") {
      await redis.zrem(scheduleKey(type), id);
      claimed.push(id);
    }
  }
  return claimed;
}

async function listJobsByIds(ids: string[]) {
  if (!ids.length) {
    return [];
  }
  const redis = await getRedis();
  const values = await redis.mget(ids.map((id) => jobKey(id)));
  return values.flatMap((value) => {
    if (!value) return [];
    try {
      return [JSON.parse(value) as AutomationJob];
    } catch {
      return [];
    }
  });
}

export async function processAutomationQueue(
  type: AutomationJobType,
  processor: (job: AutomationJob) => Promise<unknown>,
  limit = 10,
) {
  const queueStart = Date.now();
  const claimedIds = await claimDueJobIds(type, limit);
  const jobs = await listJobsByIds(claimedIds);

  for (const candidate of jobs) {
    const processing = {
      ...candidate,
      status: "processing" as const,
      updatedAt: new Date().toISOString(),
    };
    await updateAutomationJob(processing);
    const startedAt = Date.now();

    try {
      await processor(processing);
      await updateAutomationJob({
        ...processing,
        status: "completed",
        attempts: processing.attempts + 1,
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: undefined,
      });
      await incrementOpsCounter(`automation.${type}.completed`);
      await recordDurationMetric(`automation.${type}.ms`, Date.now() - startedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automation job failed.";
      const nextAttempts = processing.attempts + 1;
      const deadLetter = nextAttempts >= processing.maxAttempts;
      await updateAutomationJob({
        ...processing,
        status: deadLetter ? "dead_letter" : "failed",
        attempts: nextAttempts,
        failedAt: new Date().toISOString(),
        scheduledFor: deadLetter ? undefined : new Date(Date.now() + getBackoffMs(nextAttempts)).toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: message,
      });
      await incrementOpsCounter(`automation.${type}.${deadLetter ? "dead_letter" : "failed"}`);
      await recordOpsError({
        scope: `automation.${type}`,
        message,
        metadata: {
          jobId: processing.id,
          ...processing.payload,
        },
      });
    } finally {
      const redis = await getRedis();
      await redis.del(lockKey(candidate.id));
    }
  }

  await recordDurationMetric(`automation.${type}.queue_run_ms`, Date.now() - queueStart);
}
