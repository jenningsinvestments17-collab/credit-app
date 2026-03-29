import type { ContractDocument } from "@/lib/types";
import { contractStatusLabels } from "@/lib/ui/statusLabels";

const statusTone: Record<ContractDocument["status"], string> = {
  not_sent: "border-zinc-400/20 bg-zinc-900 text-zinc-200",
  sent: "border-accent/25 bg-accent/10 text-[#7d6434]",
  awaiting_signature: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  partially_signed: "border-sky-500/12 bg-sky-500/10 text-sky-200",
  signed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  completed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
};

export function ContractList({
  documents,
  activeDocumentKey,
}: {
  documents: ContractDocument[];
  activeDocumentKey?: string;
}) {
  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/72 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Required documents</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
          Review the packet clearly.
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          Each document sits inside one onboarding packet, with a status that makes signed versus unsigned state easy to scan.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {documents.map((document) => (
          <article
            key={document.key}
            className={`rounded-[1.2rem] border px-4 py-4 ${
              activeDocumentKey === document.key
                ? "border-accent/35 bg-accent/10"
                : "border-black/10 bg-surface-light-soft"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-dark">{document.label}</p>
                <p className="text-sm leading-7 text-zinc-600">{document.description}</p>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${statusTone[document.status]}`}>
                {contractStatusLabels[document.status]}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
