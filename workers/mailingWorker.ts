import { processAutomationQueue } from "@/lib/queue/automationQueue";
import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";
import { processMailingSubmissionJob } from "@/lib/services/mailingService";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMailingWorker(limit = 10) {
  await incrementOpsCounter("worker.mailing_submission.run");
  return processAutomationQueue("mailing_submission", processMailingSubmissionJob, limit);
}

export async function runMailingWorkerLoop(options?: {
  limit?: number;
  intervalMs?: number;
}) {
  const limit = options?.limit ?? 10;
  const intervalMs = options?.intervalMs ?? 15_000;

  for (;;) {
    try {
      await runMailingWorker(limit);
    } catch (error) {
      await recordOpsError({
        scope: "worker.mailing_submission",
        message: error instanceof Error ? error.message : "Mailing submission worker loop failed.",
      });
    }

    await sleep(intervalMs);
  }
}

async function main() {
  const limitArg = Number(process.argv[2]);
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 10;
  const loopMode = process.argv.includes("--loop");

  if (loopMode) {
    await runMailingWorkerLoop({ limit });
    return;
  }

  const result = await runMailingWorker(limit);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
