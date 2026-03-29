import { getDocumentCounts } from "@/lib/leads";
import { documentStatusLabels } from "@/lib/ui/statusLabels";
import type { RequiredDocument } from "@/lib/types";

type DocumentChecklistProps = {
  documents: RequiredDocument[];
  tone?: "light" | "dark";
};

const statusTone: Record<RequiredDocument["status"], string> = {
  missing: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  uploaded: "border-accent/25 bg-accent/10 text-[#d6c08f]",
  validated: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  needs_review: "border-sky-500/12 bg-sky-500/10 text-sky-200",
  rejected: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  partially_uploaded: "border-accent/25 bg-accent/10 text-[#d6c08f]",
  under_review: "border-sky-500/12 bg-sky-500/10 text-sky-200",
  complete: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
};

export function DocumentChecklist({
  documents,
  tone = "dark",
}: DocumentChecklistProps) {
  const counts = getDocumentCounts(documents);

  return (
    <section
      className={`rounded-[1.45rem] border p-5 ${
        tone === "dark"
          ? "border-white/10 bg-black/20"
          : "border-black/10 bg-white/72"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">Required document checklist</p>
          <h3
            className={`font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] ${
              tone === "dark" ? "text-white" : "text-text-dark"
            }`}
          >
            Keep the file complete.
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
            {counts.uploaded}/{counts.total} uploaded
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
            {counts.missing} missing
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {documents.map((document) => (
          <div
            key={document.key}
            className={`rounded-[1.2rem] border px-4 py-4 ${
              tone === "dark"
                ? "border-white/10 bg-white/[0.04]"
                : "border-black/10 bg-surface-light-soft"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p
                  className={`text-sm font-semibold ${
                    tone === "dark" ? "text-white" : "text-text-dark"
                  }`}
                >
                  {document.label}
                </p>
                <p
                  className={`text-sm leading-7 ${
                    tone === "dark" ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {document.helperText}
                </p>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${statusTone[document.status]}`}>
                {documentStatusLabels[document.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
