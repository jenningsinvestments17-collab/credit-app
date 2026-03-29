import { getRedisClient } from "@/lib/db/redis";

export async function enforceRedisAuthRateLimit(input: {
  key: string;
  limit: number;
  windowSeconds: number;
}) {
  const redis = getRedisClient();
  await redis.connect().catch(() => null);
  const count = await redis.incr(input.key);

  if (count === 1) {
    await redis.expire(input.key, input.windowSeconds);
  }

  const ttl = await redis.ttl(input.key);

  return {
    limited: count > input.limit,
    remaining: Math.max(input.limit - count, 0),
    retryAfter: ttl > 0 ? ttl : input.windowSeconds,
  };
}
