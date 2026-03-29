import { getRedisClient } from "@/lib/db/redis";
import { recordDurationMetric, recordOpsError, incrementOpsCounter } from "@/lib/monitoring/ops";
import { deliverNotificationJob } from "@/lib/notifications/sendNotification";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationJob,
  NotificationJobStatus,
  NotificationTemplateType,
} from "@/lib/types";

const PREFIX = "queue:notifications";
const ALL_JOBS_KEY = `${PREFIX}:all`;
const SCHEDULED_KEY = `${PREFIX}:scheduled`;

function jobKey(id: string) {
  return `${PREFIX}:job:${id}`;
}

function dedupeKey(key: string) {
  return `${PREFIX}:dedupe:${key}`;
}

function lockKey(id: string) {
  return `${PREFIX}:lock:${id}`;
}

function statusSetKey(status: NotificationJobStatus) {
  return `${PREFIX}:status:${status}`;
}

async function getRedis() {
  const redis = getRedisClient();
  await redis.connect().catch(() => null);
  return redis;
}

async function saveJob(job: NotificationJob) {
  const redis = await getRedis();
  const multi = redis.multi();
  const serialized = JSON.stringify(job);
  multi.set(jobKey(job.id), serialized);
  multi.zadd(ALL_JOBS_KEY, Date.parse(job.queuedAt), job.id);
  (["pending", "processing", "sent", "failed"] as NotificationJobStatus[]).forEach((status) => {
    multi.srem(statusSetKey(status), job.id);
  });
  multi.sadd(statusSetKey(job.status), job.id);

  if (job.status === "pending" || (job.status === "failed" && job.attempts < job.maxAttempts)) {
    const score = Date.parse(job.scheduledFor ?? job.queuedAt);
    multi.zadd(SCHEDULED_KEY, score, job.id);
  } else {
    multi.zrem(SCHEDULED_KEY, job.id);
  }

  if (job.dedupeKey && (job.status === "pending" || job.status === "processing" || job.status === "sent")) {
    multi.set(dedupeKey(job.dedupeKey), job.id, "EX", 60 * 60 * 24 * 30);
  }

  await multi.exec();
}

async function readJob(id: string) {
  const redis = await getRedis();
  const raw = await redis.get(jobKey(id));
  return raw ? (JSON.parse(raw) as NotificationJob) : null;
}

async function listJobsByIds(ids: string[]) {
  if (!ids.length) {
    return [];
  }

  const redis = await getRedis();
  const values = await redis.mget(ids.map((id) => jobKey(id)));
  return values.flatMap((value) => {
    if (!value) {
      return [];
    }
    try {
      return [JSON.parse(value) as NotificationJob];
    } catch {
      return [];
    }
  });
}

export async function listNotificationJobs(limit = 250) {
  const redis = await getRedis();
  const ids = await redis.zrevrange(ALL_JOBS_KEY, 0, limit - 1);
  return listJobsByIds(ids);
}

export async function getNotificationJobsForAudience(audience: NotificationAudience) {
  const jobs = await listNotificationJobs();
  return jobs.filter((job) => job.audience === audience);
}

export async function getNotificationQueueSummary() {
  const redis = await getRedis();
  const [pending, processing, sent, failed, total] = await Promise.all([
    redis.scard(statusSetKey("pending")),
    redis.scard(statusSetKey("processing")),
    redis.scard(statusSetKey("sent")),
    redis.scard(statusSetKey("failed")),
    redis.zcard(ALL_JOBS_KEY),
  ]);

  return {
    total,
    pending: pending + processing,
    sent,
    failed,
  };
}

export function buildNotificationJob(input: {
  id: string;
  userId?: string;
  leadId?: string;
  audience: NotificationAudience;
  channel: NotificationChannel;
  template: NotificationTemplateType;
  to: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
  status?: NotificationJobStatus;
  attempts?: number;
  maxAttempts?: number;
  queuedAt?: string;
  scheduledFor?: string;
  sentAt?: string;
  failedAt?: string;
  lastError?: string;
  provider?: string;
  providerMessageId?: string;
  updatedAt?: string;
}) {
  const now = input.queuedAt ?? new Date().toISOString();
  return {
    id: input.id,
    userId: input.userId,
    leadId: input.leadId,
    audience: input.audience,
    channel: input.channel,
    template: input.template,
    to: input.to,
    payload: input.payload,
    dedupeKey: input.dedupeKey,
    status: input.status ?? "pending",
    attempts: input.attempts ?? 0,
    maxAttempts: input.maxAttempts ?? 3,
    queuedAt: now,
    scheduledFor: input.scheduledFor,
    sentAt: input.sentAt,
    failedAt: input.failedAt,
    lastError: input.lastError,
    provider: input.provider,
    providerMessageId: input.providerMessageId,
    updatedAt: input.updatedAt ?? now,
  } satisfies NotificationJob;
}

export async function queueNotificationJob(job: NotificationJob) {
  if (job.dedupeKey) {
    const redis = await getRedis();
    const existingId = await redis.get(dedupeKey(job.dedupeKey));
    if (existingId) {
      const existing = await readJob(existingId);
      if (existing && ["pending", "processing", "sent"].includes(existing.status)) {
        return existing;
      }
    }
  }

  await saveJob(job);
  await incrementOpsCounter("notification.queued");
  return job;
}

export async function updateNotificationJob(job: NotificationJob) {
  await saveJob(job);
  return job;
}

export async function getAdminAlerts() {
  const jobs = await listNotificationJobs();
  return jobs
    .filter((job) => job.audience === "admin")
    .slice(0, 8)
    .map((job) => ({
      id: job.id,
      title: job.template.replaceAll("_", " "),
      status: job.status,
      channel: job.channel,
      note:
        job.status === "failed"
          ? job.lastError ?? "Notification send failed."
          : job.status === "sent"
            ? "Notification sent successfully."
            : "Notification queued and waiting for worker delivery.",
      createdAt: job.queuedAt,
    }));
}

export function canRetryNotificationJob(job: NotificationJob) {
  return job.status === "failed" && job.attempts < job.maxAttempts;
}

function getBackoffMs(attempt: number) {
  const base = 30_000;
  return Math.min(base * Math.pow(2, Math.max(attempt - 1, 0)), 15 * 60_000);
}

async function claimDueJobIds(limit: number) {
  const redis = await getRedis();
  const ids = await redis.zrangebyscore(SCHEDULED_KEY, 0, Date.now(), "LIMIT", 0, limit);
  const claimed: string[] = [];

  for (const id of ids) {
    const locked = await redis.set(lockKey(id), String(Date.now()), "EX", 120, "NX");
    if (locked === "OK") {
      await redis.zrem(SCHEDULED_KEY, id);
      claimed.push(id);
    }
  }

  return claimed;
}

export async function processNotificationQueue(limit = 20) {
  const queueStart = Date.now();
  const claimedIds = await claimDueJobIds(limit);
  const claimedJobs = await listJobsByIds(claimedIds);

  for (const candidate of claimedJobs) {
    const processing: NotificationJob = {
      ...candidate,
      status: "processing",
      updatedAt: new Date().toISOString(),
    };
    await updateNotificationJob(processing);

    const startedAt = Date.now();
    try {
      const response = await deliverNotificationJob(processing);
      await updateNotificationJob({
        ...processing,
        status: "sent",
        attempts: processing.attempts + 1,
        provider: response.provider,
        providerMessageId: response.messageId,
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: undefined,
      });
      await incrementOpsCounter("notification.sent");
      await recordDurationMetric("notification.delivery_ms", Date.now() - startedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Notification delivery failed.";
      const nextAttempts = processing.attempts + 1;
      const retryable = nextAttempts < processing.maxAttempts;
      const failedJob: NotificationJob = {
        ...processing,
        status: "failed",
        attempts: nextAttempts,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: message,
        scheduledFor: retryable
          ? new Date(Date.now() + getBackoffMs(nextAttempts)).toISOString()
          : undefined,
      };
      await updateNotificationJob(failedJob);
      await incrementOpsCounter(retryable ? "notification.retry_scheduled" : "notification.failed");
      await recordOpsError({
        scope: "notification",
        message,
        metadata: {
          template: processing.template,
          channel: processing.channel,
          jobId: processing.id,
          retryable,
        },
      });
    } finally {
      const redis = await getRedis();
      await redis.del(lockKey(candidate.id));
    }
  }

  await recordDurationMetric("notification.queue_run_ms", Date.now() - queueStart);
  return getNotificationQueueSummary();
}
