import { Button } from "@/components/ui/Button";
import { documentStatusLabels } from "@/lib/ui/statusLabels";
import type { Lead } from "@/lib/types";

function getStatusTone(status: Lead["documents"][number]["status"]) {
  if (status === "complete") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
  if (status === "under_review") {
    return "border-sky-400/20 bg-sky-500/10 text-sky-100";
  }
  if (status === "uploaded" || status === "partially_uploaded") {
    return "border-accent/25 bg-accent/10 text-[#f0ddb0]";
  }
  return "border-rose-400/20 bg-rose-500/10 text-rose-100";
}

export function ClientDocumentCenter({ lead }: { lead: Lead }) {
  const missing = lead.documents.filter((document) => document.status === "missing");

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="eyebrow">Document center</p>
          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white md:text-5xl">
            Required uploads only.
          </h2>
          <p className="max-w-2xl text-base leading-8 text-zinc-300">
            The system stays step-locked here. AI drafting does not open until the required bureau reports, ID, and proof of address are in the file.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/intake#document-upload">Upload Documents</Button>
          <Button href="/intake#intake-form" variant="secondary">
            Resume Intake
          </Button>
        </div>
      </div>

      {missing.length ? (
        <div className="mt-5 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-100">
          Still missing: {missing.map((document) => document.label).join(", ")}.
        </div>
      ) : (
        <div className="mt-5 rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-100">
          Every required upload is in the file. The case can move into review and AI when the workflow says it is ready.
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {lead.documents.map((document) => (
          <div
            key={document.key}
            className="flex flex-col gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white">
                {document.label}
              </p>
              <p className="text-sm leading-7 text-zinc-400">{document.helperText}</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${getStatusTone(document.status)}`}>
              {documentStatusLabels[document.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
