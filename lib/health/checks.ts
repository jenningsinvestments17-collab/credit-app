import { prisma } from "@/lib/db/prisma";
import { getRedisClient } from "@/lib/db/redis";
import { env } from "@/lib/env";

type DependencyStatus = {
  ok: boolean;
  latencyMs?: number;
  detail?: string;
};

async function measure<T>(label: string, fn: () => Promise<T>) {
  const startedAt = Date.now();
  try {
    const result = await fn();
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      detail: label,
      result,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : `${label} failed`,
      result: null as T | null,
    };
  }
}

export async function checkDatabaseConnectivity(): Promise<DependencyStatus> {
  const probe = await measure("postgres", async () => prisma.$queryRaw`SELECT 1`);
  return {
    ok: probe.ok,
    latencyMs: probe.latencyMs,
    detail: probe.detail,
  };
}

export async function checkRedisConnectivity(): Promise<DependencyStatus> {
  const probe = await measure("redis", async () => {
    const redis = getRedisClient();
    await redis.connect().catch(() => null);
    return redis.ping();
  });

  return {
    ok: probe.ok,
    latencyMs: probe.latencyMs,
    detail: probe.detail,
  };
}

export async function buildHealthModel() {
  const [database, redis] = await Promise.all([
    checkDatabaseConnectivity(),
    checkRedisConnectivity(),
  ]);

  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  const mailingProvider =
    env.CERTIFIED_MAIL_PROVIDER === "click2mail" ? "click2mail" : "lob";

  return {
    ok: database.ok && redis.ok && stripeConfigured,
    app: {
      environment: env.NODE_ENV,
      baseUrl: env.APP_BASE_URL,
    },
    dependencies: {
      database,
      redis,
      stripe: {
        ok: stripeConfigured,
        detail: stripeConfigured ? "configured" : "missing Stripe keys",
      },
      mailingProvider: {
        ok: true,
        detail: `${mailingProvider} adapter configured${mailingProvider ? " (provider API still requires live test credentials if you replace placeholder adapters)" : ""}`,
      },
    },
  };
}
