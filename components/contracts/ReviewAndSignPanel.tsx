import { renderContractTemplatePreview } from "@/lib/contracts";
import type { ContractDocument, Lead } from "@/lib/types";

export function ReviewAndSignPanel({
  lead,
  document,
}: {
  lead: Lead;
  document: ContractDocument | null;
}) {
  if (!document) {
    return (
      <section className="rounded-[1.8rem] border border-white/10 bg-background-soft p-6 text-white shadow-panel md:p-7">
        <div className="space-y-3">
          <p className="eyebrow">Review and sign</p>
          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em]">
            No document selected.
          </h2>
          <p className="text-sm leading-7 text-zinc-400">
            Select the next unsigned document from the packet to open the e-sign review panel.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-background-soft p-6 text-white shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Review and sign</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em]">
          {document.label}
        </h2>
        <p className="text-sm leading-7 text-zinc-400">
          Read the document, acknowledge it, and complete the signature step to keep onboarding moving forward.
        </p>
      </div>

      <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-5">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-zinc-300">
          {renderContractTemplatePreview(document, lead.fullName)}
        </pre>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="flex items-start gap-3 rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <input type="checkbox" className="mt-1" />
          <span>I have reviewed this document and understand what I am signing.</span>
        </label>
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          Signature placeholder: this area is ready for real e-sign capture, provider integration,
          signed timestamps, and audit history without changing the client experience.
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <span className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow">
          Review and Sign
        </span>
        <span className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/12 bg-white/[0.06] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white">
          Save for Later
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-zinc-400">
        After signing, the packet status will move forward and the portal will show the next onboarding step automatically.
      </p>
    </section>
  );
}
