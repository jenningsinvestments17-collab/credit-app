import { processAutomationQueue } from "@/lib/queue/automationQueue";
import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";
import { processCreditReportParsingJob } from "@/lib/services/creditReportService";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runReportExtractionWorker(limit = 15) {
  await incrementOpsCounter("worker.report_extraction.run");
  return processAutomationQueue("report_extraction", processCreditReportParsingJob, limit);
}

export async function runReportExtractionWorkerLoop(options?: {
  limit?: number;
  intervalMs?: number;
}) {
  const limit = options?.limit ?? 15;
  const intervalMs = options?.intervalMs ?? 12_000;

  for (;;) {
    try {
      await runReportExtractionWorker(limit);
    } catch (error) {
      await recordOpsError({
        scope: "worker.report_extraction",
        message: error instanceof Error ? error.message : "Report extraction worker loop failed.",
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
    await runReportExtractionWorkerLoop({ limit });
    return;
  }

  const result = await runReportExtractionWorker(limit);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
