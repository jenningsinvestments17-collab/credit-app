import { aiReviewStatusMeta } from "@/lib/leads";
import { getAIReadiness } from "@/lib/ai/review";
import type { DisputeWorkflowStatus, Lead } from "@/lib/types";

type AIReviewPanelProps = {
  lead: Lead;
  disputeId?: string;
  processingStatus?: DisputeWorkflowStatus;
};

export function AIReviewPanel({ lead, disputeId, processingStatus }: AIReviewPanelProps) {
  const readiness = getAIReadiness(lead);
  const displayStatus = processingStatus ?? readiness.status ?? lead.aiReviewStatus;
  const meta = aiReviewStatusMeta[displayStatus];
  const canReject =
    processingStatus === "awaiting_admin_review" ||
    processingStatus === "ai_generated";

  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">AI review trigger</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            Generate draft dispute letter.
          </h3>
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.tone}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-600">{meta.description}</p>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
        AI review uses uploaded bureau reports, normalized report placeholders, defect
        categories, and the stored dispute template to prepare a draft. It never auto-sends
        anything and always leaves admin review in the loop.
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {readiness.ready ? (
          <form method="POST" action={`/api/disputes/${lead.id}/generate`}>
            <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
            >
              {disputeId ? "Regenerate Draft Dispute Letter" : "Run AI Review"}
            </button>
          </form>
        ) : (
          <span className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Run AI Review
          </span>
        )}

        {disputeId && canReject ? (
          <form method="POST" action={`/api/disputes/${disputeId}/reject`}>
            <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400/45 hover:text-rose-700"
            >
              Reject Draft
            </button>
          </form>
        ) : null}

        <span className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-600">
          Admin review required
        </span>
      </div>

      {!readiness.ready ? (
        <div className="mt-5 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-900">
          AI review is unavailable until Experian, Equifax, and TransUnion are uploaded, validated, and parse-ready.
        </div>
      ) : null}
    </section>
  );
}
