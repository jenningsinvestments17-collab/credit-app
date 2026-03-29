import { processAutomationQueue } from "@/lib/queue/automationQueue";
import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";
import { processDocumentValidationJob } from "@/lib/services/documentService";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDocumentValidationWorker(limit = 20) {
  await incrementOpsCounter("worker.document_validation.run");
  return processAutomationQueue("document_validation", processDocumentValidationJob, limit);
}

export async function runDocumentValidationWorkerLoop(options?: {
  limit?: number;
  intervalMs?: number;
}) {
  const limit = options?.limit ?? 20;
  const intervalMs = options?.intervalMs ?? 10_000;

  for (;;) {
    try {
      await runDocumentValidationWorker(limit);
    } catch (error) {
      await recordOpsError({
        scope: "worker.document_validation",
        message: error instanceof Error ? error.message : "Document validation worker loop failed.",
      });
    }

    await sleep(intervalMs);
  }
}

async function main() {
  const limitArg = Number(process.argv[2]);
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 20;
  const loopMode = process.argv.includes("--loop");

  if (loopMode) {
    await runDocumentValidationWorkerLoop({ limit });
    return;
  }

  const result = await runDocumentValidationWorker(limit);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
