import { reportReadinessMeta } from "@/lib/leads";
import type { ReportReadinessStatus } from "@/lib/types";

type ReportReadinessProps = {
  status: ReportReadinessStatus;
};

export function ReportReadiness({ status }: ReportReadinessProps) {
  const meta = reportReadinessMeta[status];
  const hasReportsReady = status === "ready";

  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-black/20 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Report readiness</p>
        <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Do you have all 3 bureau reports?
        </h3>
        <p className="text-sm leading-7 text-zinc-400">
          Experian, Equifax, and TransUnion are central to the review. The workflow is
          cleaner when the client knows whether all 3 are ready before moving deeper into uploads.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-[1.2rem] border px-4 py-4 text-sm leading-7 ${
            hasReportsReady
              ? "border-accent/25 bg-accent/10 text-zinc-200"
              : "border-white/10 bg-white/[0.04] text-zinc-400"
          }`}
        >
          Yes, all 3 reports are ready
        </div>
        <div
          className={`rounded-[1.2rem] border px-4 py-4 text-sm leading-7 ${
            !hasReportsReady
              ? "border-accent/25 bg-accent/10 text-zinc-200"
              : "border-white/10 bg-white/[0.04] text-zinc-400"
          }`}
        >
          No, I still need one or more reports
        </div>
      </div>

      <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.tone}`}>
        {meta.label}
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
        {hasReportsReady ? (
          <>
            All 3 reports are marked ready, so the next move is uploading them with the ID
            and proof-of-address documents so admin can see a complete file.
          </>
        ) : (
          <>
            If the reports are not ready yet, the client should pull Experian, Equifax,
            and TransUnion before expecting a full review. This stage is structured so it
            can be hard-locked later without redesigning the flow.
          </>
        )}
      </div>
    </section>
  );
}
