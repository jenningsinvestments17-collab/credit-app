import { processAutomationQueue } from "@/lib/queue/automationQueue";
import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";
import { processPdfGenerationJob } from "@/lib/services/mailingService";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runPdfWorker(limit = 10) {
  await incrementOpsCounter("worker.pdf_generation.run");
  return processAutomationQueue("pdf_generation", processPdfGenerationJob, limit);
}

export async function runPdfWorkerLoop(options?: {
  limit?: number;
  intervalMs?: number;
}) {
  const limit = options?.limit ?? 10;
  const intervalMs = options?.intervalMs ?? 12_000;

  for (;;) {
    try {
      await runPdfWorker(limit);
    } catch (error) {
      await recordOpsError({
        scope: "worker.pdf_generation",
        message: error instanceof Error ? error.message : "PDF generation worker loop failed.",
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
    await runPdfWorkerLoop({ limit });
    return;
  }

  const result = await runPdfWorker(limit);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
