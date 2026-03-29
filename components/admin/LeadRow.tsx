import Link from "next/link";
import { getLeadStatusBarModel } from "@/lib/leads";
import { deriveClientProgress } from "@/lib/progress";
import type { BureauReportRecord, Lead } from "@/lib/types";

function getParserSignal(parsedReports: BureauReportRecord[]) {
  if (!parsedReports.length) {
    return null;
  }

  const failed = parsedReports.some((report) => report.parseStatus === "failed");
  const parsedCount = parsedReports.filter((report) => report.parseStatus === "parsed").length;
  const ocrUsed = parsedReports.some((report) => report.extractionStrategy === "ocr");

  if (failed) {
    return {
      label: "Manual Review",
      className: "border-rose-400/25 bg-rose-500/12 text-rose-700",
      title: "One or more uploaded reports need manual parser review.",
      animate: true,
    };
  }

  if (ocrUsed) {
    return {
      label: `OCR Used (${parsedCount})`,
      className: "border-amber-400/25 bg-amber-500/12 text-amber-700",
      title: "Uploaded reports parsed successfully with OCR.",
      animate: false,
    };
  }

  if (parsedCount > 0) {
    return {
      label: `Parsed (${parsedCount})`,
      className: "border-emerald-400/25 bg-emerald-500/12 text-emerald-700",
      title: "Uploaded reports parsed cleanly.",
      animate: false,
    };
  }

  return {
    label: "Pending Parse",
    className: "border-black/10 bg-surface-light-soft text-zinc-700",
    title: "Reports are uploaded and waiting on parser output.",
    animate: false,
  };
}

function getStageVisuals(stage: "red" | "orange" | "yellow" | "green") {
  if (stage === "green") {
    return {
      label: "Mailed",
      railClassName: "bg-emerald-500",
      chipClassName: "border-emerald-400/25 bg-emerald-500/12 text-emerald-700",
      wrapClassName: "border-emerald-400/25 bg-emerald-500/10",
      labelClassName: "text-emerald-700",
      textClassName: "text-emerald-900",
    };
  }

  if (stage === "yellow") {
    return {
      label: "Awaiting Review",
      railClassName: "bg-amber-400",
      chipClassName: "border-amber-400/25 bg-amber-500/12 text-amber-700",
      wrapClassName: "border-amber-400/25 bg-amber-500/10",
      labelClassName: "text-amber-700",
      textClassName: "text-amber-900",
    };
  }

  if (stage === "orange") {
    return {
      label: "Ready For AI",
      railClassName: "bg-orange-400",
      chipClassName: "border-orange-400/25 bg-orange-500/12 text-orange-700",
      wrapClassName: "border-orange-400/25 bg-orange-500/10",
      labelClassName: "text-orange-700",
      textClassName: "text-orange-900",
    };
  }

  return {
    label: "Beginning Stage",
    railClassName: "bg-rose-500",
    chipClassName: "border-rose-400/25 bg-rose-500/12 text-rose-700",
    wrapClassName: "border-rose-400/25 bg-rose-500/10",
    labelClassName: "text-rose-700",
    textClassName: "text-rose-900",
  };
}

export function LeadRow({
  lead,
  compact = false,
  parsedReports = [],
}: {
  lead: Lead;
  compact?: boolean;
  parsedReports?: BureauReportRecord[];
}) {
  const progress = deriveClientProgress(lead);
  const statusBar = getLeadStatusBarModel(lead);
  const parserSignal = getParserSignal(parsedReports);
  const stageVisuals = getStageVisuals(statusBar.stage);
  const phoneVisible = statusBar.showPhone;
  const stripeVisible = statusBar.showStripe;
  const vibrationClass = statusBar.isVibrating ? "status-vibrate" : "";

  return (
    <article
      className={`relative overflow-hidden rounded-[1.4rem] border border-black/10 bg-white/72 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-2 ${stageVisuals.railClassName}`} />
      <div
        className={`flex flex-col ${
          compact ? "gap-3" : "gap-4"
        } lg:flex-row lg:items-start lg:justify-between`}
      >
        <div className={`${compact ? "space-y-2" : "space-y-3"} pl-2 lg:flex-1`}>
          <div className="flex flex-wrap items-center gap-3">
            <h3
              className={`font-display uppercase leading-[0.92] tracking-[0.03em] text-text-dark ${
                compact ? "text-2xl" : "text-3xl"
              }`}
            >
              {lead.fullName}
            </h3>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${stageVisuals.chipClassName} ${vibrationClass}`}
            >
              {progress.completionPercent}%
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${stageVisuals.chipClassName} ${vibrationClass}`}
            >
              {statusBar.stepLabel}
            </span>
            {phoneVisible ? (
              <span className="phone-vibrate inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-lg text-[#7d6434]">
                &#9742;
              </span>
            ) : null}
            {stripeVisible ? (
              <span
                title="Stripe pre-authorization / payment gate"
                className="status-vibrate inline-flex h-10 items-center justify-center rounded-full border border-sky-400/25 bg-sky-500/12 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700"
              >
                Stripe
              </span>
            ) : null}
            {parserSignal ? (
              <span
                title={parserSignal.title}
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${parserSignal.className} ${parserSignal.animate ? "status-vibrate" : ""}`}
              >
                {parserSignal.label}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm leading-6 text-zinc-600">
            <span>{lead.email}</span>
            <span>{lead.phone}</span>
            <span className="text-zinc-500">ID: {lead.id}</span>
          </div>
          <div className={`rounded-2xl border px-4 py-3 ${stageVisuals.wrapClassName}`}>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${stageVisuals.labelClassName}`}>
              Problem
            </p>
            <p className={`mt-1 text-sm leading-6 ${stageVisuals.textClassName}`}>
              {statusBar.problem}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          {stageVisuals.label}
        </span>
        <Link
          href={`/admin/leads/${lead.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-[0.9rem] border border-black/10 bg-white px-4 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
        >
          View Lead Detail
        </Link>
      </div>

      {compact ? null : (
        <div className="mt-4 grid gap-3">
          {lead.notes.map((note) => (
            <div
              key={note}
              className="rounded-2xl border border-black/10 bg-surface-light-soft px-4 py-3 text-sm leading-7 text-zinc-700"
            >
              {note}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
