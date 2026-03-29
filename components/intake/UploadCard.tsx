import { documentStatusLabels } from "@/lib/ui/statusLabels";
import type { BureauReportRecord, RequiredDocument } from "@/lib/types";

type UploadCardProps = {
  document: RequiredDocument;
  leadId?: string | null;
  returnTo?: string;
  parsedReport?: BureauReportRecord | null;
};

function getParseStatusCopy(parsedReport?: BureauReportRecord | null) {
  if (!parsedReport) {
    return null;
  }

  if (parsedReport.parseStatus === "parsed") {
    return {
      title: parsedReport.extractionStrategy === "ocr" ? "OCR used" : "Parse complete",
      tone:
        parsedReport.extractionStrategy === "ocr"
          ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
          : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
      body:
        parsedReport.extractionStrategy === "ocr"
          ? `This file looked scanned, so OCR was used. ${parsedReport.tradelineCount ?? 0} tradeline${parsedReport.tradelineCount === 1 ? "" : "s"} were captured for review.`
          : `${parsedReport.tradelineCount ?? 0} tradeline${parsedReport.tradelineCount === 1 ? "" : "s"} parsed from the uploaded report.`,
    };
  }

  if (parsedReport.parseStatus === "failed") {
    return {
      title: "Needs manual review",
      tone: "border-rose-400/25 bg-rose-500/10 text-rose-200",
      body:
        parsedReport.parseError ??
        "We saved the upload, but the parser could not confidently read the report. Admin can still review it manually.",
    };
  }

  return {
    title: "Parsing pending",
    tone: "border-white/10 bg-white/[0.05] text-zinc-300",
    body: "This upload is saved and waiting for parse processing.",
  };
}

export function UploadCard({
  document,
  leadId,
  returnTo = "/intake",
  parsedReport,
}: UploadCardProps) {
  const isBureauReport =
    document.key === "experian_report" ||
    document.key === "equifax_report" ||
    document.key === "transunion_report";
  const canUpload = Boolean(leadId && isBureauReport);
  const parseState = isBureauReport ? getParseStatusCopy(parsedReport) : null;

  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-display text-2xl uppercase leading-[0.92] tracking-[0.03em] text-white">
            {document.label}
          </p>
          <p className="text-sm leading-7 text-zinc-400">{document.helperText}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
          {documentStatusLabels[document.status]}
        </span>
      </div>

      {parseState ? (
        <div className={`mt-4 rounded-[1.1rem] border px-4 py-4 text-sm leading-7 ${parseState.tone}`}>
          <p className="text-[11px] uppercase tracking-[0.22em]">Parser status</p>
          <p className="mt-2 font-semibold uppercase tracking-[0.06em]">{parseState.title}</p>
          <p className="mt-2">{parseState.body}</p>
        </div>
      ) : null}

      {leadId ? (
        <form
          method="POST"
          action="/api/reports/upload"
          encType="multipart/form-data"
          className="mt-4 space-y-3 rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm leading-7 text-zinc-400"
        >
          <input type="hidden" name="leadId" value={leadId ?? ""} />
          <input type="hidden" name="documentKey" value={document.key} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input
            type="file"
            name="file"
            accept={isBureauReport ? ".pdf" : ".pdf,.png,.jpg,.jpeg"}
            className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
            required
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-[0.9rem] border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-accent"
          >
            {isBureauReport ? "Upload Report PDF" : "Upload Document"}
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm leading-7 text-zinc-400">
          {isBureauReport
            ? "Sign in through the client portal to attach this bureau report to the live parser workflow."
            : "Future upload handler goes here. This card is ready for real file storage, validation, and persistence without changing the workflow layout."}
        </div>
      )}
    </article>
  );
}
