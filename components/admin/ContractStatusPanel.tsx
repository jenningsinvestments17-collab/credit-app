import { contractPacketMeta, getContractCounts, getNextUnsignedContract } from "@/lib/contracts";
import type { Lead } from "@/lib/types";

function getContractDocumentProgress(status: Lead["contractDocuments"][number]["status"]) {
  if (status === "signed" || status === "completed") {
    return {
      badgeClassName: "border-emerald-500/30 bg-emerald-600 text-white",
      cardClassName: "border-emerald-400/25 bg-emerald-500/10",
      fillClassName: "bg-emerald-500/18",
      textClassName: "text-emerald-950",
      subtextClassName: "text-emerald-900/80",
      percent: 100,
    };
  }

  if (status === "awaiting_signature") {
    return {
      badgeClassName: "border-rose-500/30 bg-rose-600 text-white",
      cardClassName: "border-rose-400/25 bg-rose-500/10",
      fillClassName: "bg-rose-500/18",
      textClassName: "text-rose-950",
      subtextClassName: "text-rose-900/80",
      percent: 25,
    };
  }

  if (status === "partially_signed") {
    return {
      badgeClassName: "border-amber-500/30 bg-amber-500 text-white",
      cardClassName: "border-amber-400/25 bg-amber-500/10",
      fillClassName: "bg-amber-500/18",
      textClassName: "text-amber-950",
      subtextClassName: "text-amber-900/80",
      percent: 70,
    };
  }

  if (status === "sent") {
    return {
      badgeClassName: "border-sky-500/30 bg-sky-600 text-white",
      cardClassName: "border-sky-400/25 bg-sky-500/10",
      fillClassName: "bg-sky-500/18",
      textClassName: "text-sky-950",
      subtextClassName: "text-sky-900/80",
      percent: 50,
    };
  }

  return {
    badgeClassName: "border-black/10 bg-zinc-600 text-white",
    cardClassName: "border-black/10 bg-surface-light-soft",
    fillClassName: "bg-zinc-500/12",
    textClassName: "text-text-dark",
    subtextClassName: "text-zinc-600",
    percent: 0,
  };
}

function getContractDocumentTone(status: Lead["contractDocuments"][number]["status"]) {
  return getContractDocumentProgress(status).badgeClassName;
}

export function ContractStatusPanel({ lead }: { lead: Lead }) {
  const meta = contractPacketMeta[lead.contractPacketStatus];
  const counts = getContractCounts(lead.contractDocuments);
  const nextUnsigned = getNextUnsignedContract(lead.contractDocuments);

  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Contract packet</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            Signature workflow status.
          </h3>
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.tone}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-600">{meta.description}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
          <strong className="text-text-dark">{counts.sent}</strong> packet items sent
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
          <strong className="text-text-dark">{counts.signed}</strong> signed
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
          {nextUnsigned ? `Waiting on ${nextUnsigned.label}` : "Packet complete"}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {lead.contractDocuments.map((document) => {
          const progress = getContractDocumentProgress(document.status);

          return (
            <div
              key={document.key}
              className={`relative overflow-hidden rounded-[1.2rem] border px-4 py-4 ${progress.cardClassName}`}
            >
              <div
                className={`absolute inset-y-0 left-0 ${progress.fillClassName}`}
                style={{ width: `${progress.percent}%` }}
              />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${progress.textClassName}`}>{document.label}</p>
                    <p className={`text-sm leading-7 ${progress.subtextClassName}`}>{document.description}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${getContractDocumentTone(document.status)}`}
                  >
                    {document.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/8">
                  <div className={`h-full rounded-full ${progress.fillClassName.replace(/\/18|\/12/g, "")}`} style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
