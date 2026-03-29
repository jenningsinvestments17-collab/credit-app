import { getRedisClient } from "@/lib/db/redis";

const METRIC_PREFIX = "ops:metric";
const DURATION_PREFIX = "ops:duration";
const ERROR_LIST_KEY = "ops:errors";
const MAX_ERROR_LOGS = 100;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getRedis() {
  const redis = getRedisClient();
  await redis.connect().catch(() => null);
  return redis;
}

export async function incrementOpsCounter(metric: string, amount = 1) {
  const redis = await getRedis();
  const key = `${METRIC_PREFIX}:${todayKey()}`;
  await redis.hincrby(key, metric, amount);
  await redis.expire(key, 60 * 60 * 24 * 14);
}

export async function recordDurationMetric(metric: string, durationMs: number) {
  const redis = await getRedis();
  const key = `${DURATION_PREFIX}:${todayKey()}:${metric}`;
  await redis.hincrby(key, "count", 1);
  await redis.hincrbyfloat(key, "sum", durationMs);
  await redis.hset(key, "last", durationMs);
  const currentMax = Number((await redis.hget(key, "max")) ?? "0");
  if (durationMs > currentMax) {
    await redis.hset(key, "max", durationMs);
  }
  await redis.expire(key, 60 * 60 * 24 * 14);
}

export async function recordOpsError(input: {
  scope: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const redis = await getRedis();
  const safeMetadata = Object.fromEntries(
    Object.entries(input.metadata ?? {}).filter(([key]) => !["email", "phone", "token", "password", "parsedText", "letterText"].includes(key)),
  );

  const event = {
    scope: input.scope,
    message: input.message.slice(0, 240),
    metadata: safeMetadata,
    createdAt: new Date().toISOString(),
  };

  await redis.lpush(ERROR_LIST_KEY, JSON.stringify(event));
  await redis.ltrim(ERROR_LIST_KEY, 0, MAX_ERROR_LOGS - 1);
  await incrementOpsCounter(`errors:${input.scope}`);
}

export async function getOpsDashboardModel() {
  const redis = await getRedis();
  const metricKey = `${METRIC_PREFIX}:${todayKey()}`;
  const metrics = await redis.hgetall(metricKey);
  const errors = (await redis.lrange(ERROR_LIST_KEY, 0, 9)).flatMap((entry) => {
    try {
      return [JSON.parse(entry) as { scope: string; message: string; createdAt: string }];
    } catch {
      return [];
    }
  });

  const durationKeys: string[] = [];
  let cursor = "0";
  do {
    const [nextCursor, batch] = await redis.scan(
      cursor,
      "MATCH",
      `${DURATION_PREFIX}:${todayKey()}:*`,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    durationKeys.push(...batch);
  } while (cursor !== "0");
  const durationRows = await Promise.all(
    durationKeys.map(async (key) => {
      const stats = await redis.hgetall(key);
      return {
        metric: key.split(":").slice(-1)[0],
        count: Number(stats.count ?? 0),
        avgMs:
          Number(stats.count ?? 0) > 0
            ? Math.round((Number(stats.sum ?? 0) / Number(stats.count ?? 1)) * 10) / 10
            : 0,
        maxMs: Number(stats.max ?? 0),
        lastMs: Number(stats.last ?? 0),
      };
    }),
  );

  return {
    metrics,
    durations: durationRows.sort((a, b) => b.maxMs - a.maxMs),
    errors,
  };
}
