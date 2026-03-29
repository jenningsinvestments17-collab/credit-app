import {
  documentCollectionMeta,
  getDocumentCounts,
  getLeadStatusBarModel,
  hasAllBureauReports,
  isLeadReadyForReview,
  reportReadinessMeta,
} from "@/lib/leads";
import type { Lead } from "@/lib/types";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getFlowFillClass(percent: number) {
  if (percent >= 100) {
    return "bg-emerald-500/22";
  }

  if (percent >= 70) {
    return "bg-amber-500/18";
  }

  if (percent >= 35) {
    return "bg-orange-500/16";
  }

  return "bg-rose-500/16";
}

function getFlowBarClass(percent: number) {
  if (percent >= 100) return "bg-emerald-500";
  if (percent >= 70) return "bg-amber-500";
  if (percent >= 35) return "bg-orange-500";
  return "bg-rose-500";
}

function getCardSurfaceClass(percent: number) {
  if (percent >= 100) return "border-emerald-500/30 bg-emerald-600 text-white";
  if (percent >= 70) return "border-amber-500/30 bg-amber-500 text-white";
  if (percent >= 35) return "border-orange-500/30 bg-orange-500 text-white";
  return "border-rose-500/30 bg-rose-600 text-white";
}

function FlowBadge({
  label,
  value,
  percent,
  toneClassName,
}: {
  label: string;
  value: string;
  percent: number;
  toneClassName: string;
}) {
  const width = clampPercent(percent);
  const flowBarClass = getFlowBarClass(width);
  const surfaceClass = toneClassName || getCardSurfaceClass(width);

  return (
    <div className={`relative overflow-hidden rounded-[1.2rem] border px-4 py-4 ${surfaceClass}`}>
      <div className={`absolute inset-y-0 left-0 ${getFlowFillClass(width)}`} style={{ width: `${width}%` }} />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.22em]">{label}</p>
        <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className={`h-full rounded-full ${flowBarClass}`} style={{ width: `${width}%` }} />
        </div>
      </div>
    </div>
  );
}

export function LeadDocumentsPanel({ lead }: { lead: Lead }) {
  const clientStage = getLeadStatusBarModel(lead).stage;
  const reportMeta = reportReadinessMeta[lead.reportReadiness];
  const documentMeta = documentCollectionMeta[lead.documentCollectionStatus];
  const counts = getDocumentCounts(lead.documents);
  const allReportsReady = hasAllBureauReports(lead.documents);
  const reviewReady = isLeadReadyForReview(lead);
  const missingDocuments = lead.documents.filter((document) => document.status === "missing");
  const reportPercent =
    lead.reportReadiness === "ready" ? 100 : lead.reportReadiness === "partial" ? 66 : 0;
  const documentPercent =
    lead.documentCollectionStatus === "complete"
      ? 100
      : lead.documentCollectionStatus === "under_review"
        ? 75
        : lead.documentCollectionStatus === "partially_uploaded"
          ? 45
          : 0;
  const receivedPercent = counts.total > 0 ? (counts.uploaded / counts.total) * 100 : 0;
  const reviewMeta =
    lead.documentCollectionStatus === "complete"
      ? {
          tone: "border-emerald-500/30 bg-emerald-600 text-white",
          label: "Reviewed",
          percent: 100,
        }
      : lead.documentCollectionStatus === "under_review"
        ? {
            tone: "border-rose-500/30 bg-rose-600 text-white",
            label: "Under Review",
            percent: 75,
          }
        : {
            tone:
              clientStage === "yellow"
                ? "border-amber-500/30 bg-amber-500 text-white"
                : clientStage === "orange"
                  ? "border-orange-500/30 bg-orange-500 text-white"
                  : "border-rose-500/30 bg-rose-600 text-white",
            label: reviewReady ? "Ready" : "Needs Follow-Up",
            percent: reviewReady ? 85 : 35,
          };

  const reportTone =
    lead.reportReadiness === "ready"
      ? "border-emerald-500/30 bg-emerald-600 text-white"
      : lead.reportReadiness === "partial"
        ? "border-orange-500/30 bg-orange-500 text-white"
        : "border-rose-500/30 bg-rose-600 text-white";

  const documentTone =
    lead.documentCollectionStatus === "complete"
      ? "border-emerald-500/30 bg-emerald-600 text-white"
      : lead.documentCollectionStatus === "under_review"
        ? "border-rose-500/30 bg-rose-600 text-white"
        : lead.documentCollectionStatus === "partially_uploaded"
          ? "border-orange-500/30 bg-orange-500 text-white"
          : "border-rose-500/30 bg-rose-600 text-white";

  const receivedTone =
    receivedPercent >= 100
      ? "border-emerald-500/30 bg-emerald-600 text-white"
      : receivedPercent >= 70
        ? "border-amber-500/30 bg-amber-500 text-white"
        : receivedPercent >= 35
          ? "border-orange-500/30 bg-orange-500 text-white"
          : "border-rose-500/30 bg-rose-600 text-white";

  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Lead documents</p>
        <h3 className="font-display text-2xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark md:text-3xl">
          Compact readiness snapshot.
        </h3>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FlowBadge
          label="Reports"
          value={reportMeta.label}
          percent={reportPercent}
          toneClassName={reportTone}
        />
        <FlowBadge
          label="Documents"
          value={documentMeta.label}
          percent={documentPercent}
          toneClassName={documentTone}
        />
        <FlowBadge
          label="Received"
          value={`${counts.uploaded} / ${counts.total}`}
          percent={receivedPercent}
          toneClassName={receivedTone}
        />
        <FlowBadge
          label="Review"
          value={reviewMeta.label}
          percent={reviewMeta.percent}
          toneClassName={reviewMeta.tone}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lead.documents.map((document) => (
          <span
            key={document.key}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/72 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-700"
          >
            <span
              className={document.status === "missing" ? "text-rose-600" : "text-emerald-700"}
            >
              {document.status === "missing" ? "Missing" : "In"}
            </span>
            <span>{document.label}</span>
          </span>
        ))}
      </div>

      {!allReportsReady || missingDocuments.length > 0 ? (
        <div className="mt-4 rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
          <strong className="text-text-dark">Still missing:</strong>{" "}
          {missingDocuments.length > 0
            ? missingDocuments.map((document) => document.label).join(", ")
            : "No missing uploads, waiting on review readiness."}
        </div>
      ) : null}

      {allReportsReady && reviewReady ? (
        <div className="mt-4 rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-700">
          All 3 bureau reports are in and the file is positioned for review.
        </div>
      ) : null}
    </section>
  );
}
