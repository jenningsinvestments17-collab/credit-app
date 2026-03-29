import { PrismaClient } from "@prisma/client";
import { recordDurationMetric, recordOpsError } from "@/lib/monitoring/ops";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const baseClient =
  globalThis.__prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const prisma = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const startedAt = Date.now();
        try {
          const result = await query(args);
          const durationMs = Date.now() - startedAt;
          void recordDurationMetric(`db.${model}.${operation}`, durationMs);
          if (durationMs > 250) {
            void recordOpsError({
              scope: "db.slow_query",
              message: `${model}.${operation} exceeded slow-query threshold`,
              metadata: {
                model,
                operation,
                durationMs,
              },
            });
          }
          return result;
        } catch (error) {
          void recordOpsError({
            scope: "db.query_error",
            message: error instanceof Error ? error.message : "Database query failed.",
            metadata: {
              model,
              operation,
            },
          });
          throw error;
        }
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = baseClient;
}
