import { processAutomationQueue } from "@/lib/queue/automationQueue";
import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";
import { processTrackingReconciliationJob } from "@/lib/services/mailingService";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWebhookReconcileWorker(limit = 15) {
  await incrementOpsCounter("worker.tracking_reconciliation.run");
  return processAutomationQueue("tracking_reconciliation", processTrackingReconciliationJob, limit);
}

export async function runWebhookReconcileWorkerLoop(options?: {
  limit?: number;
  intervalMs?: number;
}) {
  const limit = options?.limit ?? 15;
  const intervalMs = options?.intervalMs ?? 15_000;

  for (;;) {
    try {
      await runWebhookReconcileWorker(limit);
    } catch (error) {
      await recordOpsError({
        scope: "worker.tracking_reconciliation",
        message: error instanceof Error ? error.message : "Webhook reconciliation worker loop failed.",
      });
    }

    await sleep(intervalMs);
  }
}

async function main() {
  const limitArg = Number(process.argv[2]);
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 15;
  const loopMode = process.argv.includes("--loop");

  if (loopMode) {
    await runWebhookReconcileWorkerLoop({ limit });
    return;
  }

  const result = await runWebhookReconcileWorker(limit);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
