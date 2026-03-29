import { Button } from "@/components/ui/Button";
import { DocumentChecklistItem } from "@/components/client/dashboard/DocumentChecklistItem";
import type { ClientDashboardViewModel } from "@/types/dashboard";

export function DocumentCenter({ model }: { model: ClientDashboardViewModel }) {
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

      {model.documentSummary.missingLabels.length ? (
        <div className="mt-5 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-100">
          Still missing: {model.documentSummary.missingLabels.join(", ")}.
        </div>
      ) : (
        <div className="mt-5 rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-100">
          Every required upload is in the file. The case can move into review and AI when the workflow says it is ready.
        </div>
      )}

      {model.documentSummary.blockerReasons?.length ? (
        <div className="mt-4 rounded-[1.2rem] border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-100">
          {model.documentSummary.blockerReasons.slice(0, 3).join(" ")}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">{model.documentSummary.uploaded}</strong> of {model.documentSummary.total} uploaded
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">{model.documentSummary.readyLabel}</strong>
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">{model.documentSummary.missingLabels.length}</strong> still missing
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {model.lead.documents.map((document) => (
          <DocumentChecklistItem key={document.key} document={document} />
        ))}
      </div>
    </section>
  );
}
