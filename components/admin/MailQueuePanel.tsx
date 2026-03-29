import { mailTemplateMeta } from "@/lib/mail/templates";
import { getLeadMailTriggerPreview, getQueuedWorkflowNotificationsForLead } from "@/lib/mail/triggers";
import {
  canRetryMailJob,
  getMailJobs,
  getMailJobsForLead,
  getMailQueueSummary,
  mailJobStatusMeta,
} from "@/lib/queue/mailQueue";
import type { Lead } from "@/lib/types";

type MailQueuePanelProps = {
  lead?: Lead;
  mode?: "summary" | "lead";
};

export function MailQueuePanel({ lead, mode = "summary" }: MailQueuePanelProps) {
  const jobs = lead ? getMailJobsForLead(lead.id) : getMailJobs();
  const summary = getMailQueueSummary();
  const queuedPreviews = lead ? getQueuedWorkflowNotificationsForLead(lead) : [];
  const triggerPreview = lead ? getLeadMailTriggerPreview(lead) : [];

  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">{mode === "lead" ? "Lead notifications" : "Mail queue"}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {mode === "lead" ? "Email delivery and next notifications." : "Delivery status across the pipeline."}
          </h3>
          {mode === "summary" ? (
            <span className="rounded-full border border-black/10 bg-surface-light-soft px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
              {summary.total} total jobs
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-7 text-zinc-600">
          {mode === "lead"
            ? "This keeps the client and admin handoff visible without sending directly from the UI."
            : "Email jobs queue through a shared service layer so delivery, retry state, and future worker integration stay organized."}
        </p>
      </div>

      {mode === "summary" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">{summary.total}</strong> jobs tracked
          </div>
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">{summary.pending}</strong> pending
          </div>
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">{summary.sent}</strong> sent
          </div>
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">{summary.failed}</strong> failed
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {jobs.slice(0, mode === "lead" ? jobs.length : 4).map((job) => {
          const statusMeta = mailJobStatusMeta[job.status];

          return (
            <div
              key={job.id}
              className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text-dark">
                    {mailTemplateMeta[job.type].label}
                  </p>
                  <p className="text-sm leading-7 text-zinc-600">
                    To {job.to} | {job.audience}
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${statusMeta.tone}`}>
                  {statusMeta.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <span>Attempts {job.attempts}/{job.maxAttempts}</span>
                <span>{job.provider ?? "provider pending"}</span>
                {canRetryMailJob(job) ? <span className="text-[#7d6434]">retry eligible</span> : null}
              </div>

              {job.lastError ? (
                <p className="mt-3 text-sm leading-7 text-rose-600">{job.lastError}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {lead ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Suggested next emails</p>
            <div className="mt-3 grid gap-3">
              {queuedPreviews.length > 0 ? (
                queuedPreviews.map((job) => (
                  <div
                    key={job.id}
                    className="min-w-0 rounded-2xl border border-black/10 bg-white/72 px-4 py-3 text-sm leading-6 text-zinc-700"
                  >
                    <p className="break-words font-semibold text-text-dark">
                      {mailTemplateMeta[job.type].label}
                    </p>
                    <p className="mt-1 break-all text-zinc-600">
                      queued for {job.to}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-zinc-600">
                  No new notifications are suggested from the current lead state.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Trigger notes</p>
            <div className="mt-3 grid gap-3">
              {triggerPreview.length > 0 ? (
                triggerPreview.map((item) => (
                  <div
                    key={`${item.type}-${item.reason}`}
                    className="min-w-0 rounded-2xl border border-black/10 bg-white/72 px-4 py-3 text-sm leading-6 text-zinc-700"
                  >
                    <p className="break-words font-semibold text-text-dark">{item.label}</p>
                    <p className="mt-1 break-words text-zinc-600">{item.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-zinc-600">
                  No additional trigger notes are needed from the current state.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
