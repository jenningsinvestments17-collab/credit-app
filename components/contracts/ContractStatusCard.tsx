import { contractPacketMeta, getContractCounts } from "@/lib/contracts";
import type { ContractPacketStatus, ContractDocument } from "@/lib/types";

export function ContractStatusCard({
  status,
  documents,
}: {
  status: ContractPacketStatus;
  documents: ContractDocument[];
}) {
  const meta = contractPacketMeta[status];
  const counts = getContractCounts(documents);

  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/72 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Contract packet status</p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {meta.label}
          </h2>
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.tone}`}>
            {counts.signed}/{counts.totalRequired} signed
          </span>
        </div>
        <p className="text-base leading-8 text-zinc-600">{meta.description}</p>
      </div>
    </section>
  );
}
