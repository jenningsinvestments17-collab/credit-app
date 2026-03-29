import { incrementOpsCounter, recordOpsError } from "@/lib/monitoring/ops";
import { runAiGenerationWorkerLoop } from "@/workers/aiGenerationWorker";
import { runDocumentValidationWorkerLoop } from "@/workers/documentValidationWorker";
import { runMailingWorkerLoop } from "@/workers/mailingWorker";
import { runPdfWorkerLoop } from "@/workers/pdfWorker";
import { runReportExtractionWorkerLoop } from "@/workers/reportExtractionWorker";
import { runWebhookReconcileWorkerLoop } from "@/workers/webhookReconcileWorker";

function log(message: string, metadata?: Record<string, unknown>) {
  const payload = {
    scope: "workers.index",
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(payload));
}

async function main() {
  const mode = process.argv[2] ?? "all";
  const loop = process.argv.includes("--loop");

  await incrementOpsCounter("worker.runtime.start");
  log("worker runtime starting", { mode, loop });

  try {
    if (mode === "documents" || mode === "all") {
      void runDocumentValidationWorkerLoop();
    }
    if (mode === "reports" || mode === "all") {
      void runReportExtractionWorkerLoop();
    }
    if (mode === "ai" || mode === "all") {
      void runAiGenerationWorkerLoop();
    }
    if (mode === "pdf" || mode === "all") {
      void runPdfWorkerLoop();
    }
    if (mode === "mailing" || mode === "all") {
      void runMailingWorkerLoop();
    }
    if (mode === "reconcile" || mode === "all") {
      void runWebhookReconcileWorkerLoop();
    }

    if (!loop) {
      log("worker runtime started without --loop; keeping process alive for long-running workers");
    }

    await new Promise(() => undefined);
  } catch (error) {
    await recordOpsError({
      scope: "workers.index",
      message: error instanceof Error ? error.message : "Worker runtime failed.",
    });
    throw error;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
