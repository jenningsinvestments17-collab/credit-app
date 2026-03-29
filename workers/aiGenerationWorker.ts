import { processAutomationQueue } from "@/lib/queue/automationQueue";
import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";
import { processAiGenerationJob } from "@/lib/services/disputeService";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAiGenerationWorker(limit = 10) {
  await incrementOpsCounter("worker.ai_generation.run");
  return processAutomationQueue("ai_generation", processAiGenerationJob, limit);
}

export async function runAiGenerationWorkerLoop(options?: {
  limit?: number;
  intervalMs?: number;
}) {
  const limit = options?.limit ?? 10;
  const intervalMs = options?.intervalMs ?? 10_000;

  for (;;) {
    try {
      await runAiGenerationWorker(limit);
    } catch (error) {
      await recordOpsError({
        scope: "worker.ai_generation",
        message: error instanceof Error ? error.message : "AI generation worker loop failed.",
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
    await runAiGenerationWorkerLoop({ limit });
    return;
  }

  const result = await runAiGenerationWorker(limit);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
