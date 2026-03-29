import { getRedisClient } from "@/lib/db/redis";

export async function updateRateLimitStore(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  if (!process.env.REDIS_URL?.trim()) {
    return {
      count: 0,
      remaining: input.limit,
      resetAt: Date.now() + input.windowMs,
      limited: false,
    };
  }

  const redis = getRedisClient();
  try {
    await redis.connect().catch(() => null);

    const namespacedKey = `ratelimit:${input.key}`;
    const count = await redis.incr(namespacedKey);

    if (count === 1) {
      await redis.pexpire(namespacedKey, input.windowMs);
    }

    const ttl = await redis.pttl(namespacedKey);
    const resetAt = Date.now() + Math.max(ttl, 0);

    return {
      count,
      remaining: Math.max(input.limit - count, 0),
      resetAt,
      limited: count > input.limit,
    };
  } catch {
    return {
      count: 0,
      remaining: input.limit,
      resetAt: Date.now() + input.windowMs,
      limited: false,
    };
  }
}
