import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

export function getRedisClient() {
  const url = process.env.REDIS_URL?.trim();

  if (!url) {
    throw new Error("REDIS_URL is not configured.");
  }

  if (!globalThis.__redisClient) {
    globalThis.__redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableAutoPipelining: true,
      reconnectOnError: () => true,
    });
    globalThis.__redisClient.on("error", () => {
      // Connection failures are surfaced by active health checks and callers.
    });
  }

  return globalThis.__redisClient;
}
