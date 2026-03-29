import { documentStatusLabels } from "@/lib/ui/statusLabels";
import type { RequiredDocument } from "@/lib/types";

function getStatusTone(status: RequiredDocument["status"]) {
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

export function DocumentChecklistItem({ document }: { document: RequiredDocument }) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 md:flex-row md:items-center md:justify-between">
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
  );
}
