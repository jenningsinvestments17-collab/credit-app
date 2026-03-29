import { processNotificationQueue } from "@/lib/queue/notificationQueue";
import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";

export async function runNotificationWorker(limit = 25) {
  await incrementOpsCounter("worker.notification.run");
  return processNotificationQueue(limit);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runNotificationWorkerLoop(options?: {
  limit?: number;
  intervalMs?: number;
}) {
  const limit = options?.limit ?? 25;
  const intervalMs = options?.intervalMs ?? 15_000;

  for (;;) {
    try {
      await runNotificationWorker(limit);
    } catch (error) {
      await recordOpsError({
        scope: "worker.notification",
        message: error instanceof Error ? error.message : "Notification worker loop failed.",
      });
    }
    await sleep(intervalMs);
  }
}

async function main() {
  const limitArg = Number(process.argv[2]);
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 25;
  const loopMode = process.argv.includes("--loop");
  if (loopMode) {
    await runNotificationWorkerLoop({ limit });
    return;
  }
  const result = await runNotificationWorker(limit);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
