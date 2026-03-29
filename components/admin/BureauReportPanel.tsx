import type { Bureau, ReportSource } from "@/lib/types";

export function BureauReportPanel({
  bureau,
  source,
}: {
  bureau: Bureau;
  source: ReportSource | null;
}) {
  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Source report</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {bureau} report beside draft.
          </h3>
          <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-700">
            {source?.uploaded ? "report loaded" : "report missing"}
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-600">
          Review the draft against the matching bureau source so manual edits stay tied to the actual uploaded report.
        </p>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
        <strong className="text-text-dark">Document key:</strong> {source?.documentKey ?? "not linked"}
        {" | "}
        <strong className="text-text-dark">Status:</strong> {source?.uploaded ? "uploaded" : "missing"}
        {source?.parseStatus ? (
          <>
            {" | "}
            <strong className="text-text-dark">Parse:</strong> {source.parseStatus}
          </>
        ) : null}
        {source?.extractionStrategy ? (
          <>
            {" | "}
            <strong className="text-text-dark">Method:</strong> {source.extractionStrategy}
          </>
        ) : null}
        {typeof source?.scannedLikely === "boolean" ? (
          <>
            {" | "}
            <strong className="text-text-dark">Scanned:</strong> {source.scannedLikely ? "likely" : "no"}
          </>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
        <strong className="text-text-dark">File:</strong> {source?.originalFilename ?? "not linked"}
        {source?.storagePath ? (
          <>
            {" | "}
            <strong className="text-text-dark">Path:</strong> {source.storagePath}
          </>
        ) : null}
        {source?.parsedTradelines ? (
          <>
            {" | "}
            <strong className="text-text-dark">Tradelines:</strong> {source.parsedTradelines.length}
          </>
        ) : null}
        {source?.parseError ? (
          <>
            {" | "}
            <strong className="text-text-dark">Error:</strong> {source.parseError}
          </>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-white/72 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Normalized summary</p>
        <p className="mt-3 text-sm leading-7 text-zinc-700">
          {source?.normalizedSummary ?? "No normalized bureau summary is available yet."}
        </p>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-white/72 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Extracted report text</p>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-zinc-700">
          {source?.extractedText ?? "No extracted report text is available yet."}
        </pre>
      </div>
    </section>
  );
}
