import { DocumentChecklist } from "@/components/intake/DocumentChecklist";
import { getDocumentCounts, reportReadinessMeta } from "@/lib/leads";
import type { Lead } from "@/lib/types";

export function DocumentStatusPanel({ lead }: { lead: Lead }) {
  const reportMeta = reportReadinessMeta[lead.reportReadiness];
  const counts = getDocumentCounts(lead.documents);
  const missing = lead.documents.filter((document) => document.status === "missing");

  return (
    <section className="grid gap-5">
      <div className="rounded-[1.8rem] border border-black/10 bg-white/72 p-6 shadow-panel md:p-7">
        <div className="space-y-3">
          <p className="eyebrow">Report readiness</p>
          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {reportMeta.label}
          </h2>
          <p className="text-base leading-8 text-zinc-600">{reportMeta.description}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">{counts.uploaded}</strong> of {counts.total} uploaded
          </div>
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">{counts.ready}</strong> review-ready
          </div>
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">{missing.length}</strong> still missing
          </div>
        </div>

        {missing.length ? (
          <div className="mt-5 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-700">
            Missing right now: {missing.map((document) => document.label).join(", ")}.
          </div>
        ) : (
          <div className="mt-5 rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-700">
            Every required upload is in the file. Admin review can move forward cleanly from here.
          </div>
        )}
      </div>

      <DocumentChecklist documents={lead.documents} tone="light" />
    </section>
  );
}
