import type {
  DisputeRecord,
  DisputeVersionRecord,
  MailingJobRecord,
  PaymentRecord,
} from "@/lib/types";
import { disputeWorkflowStatusMeta } from "@/lib/disputes/mailing";
import { mailingProviderStatusLabels, paymentStatusLabels } from "@/lib/ui/statusLabels";
import { isPaymentSettled } from "@/lib/stripe/service";

export function ApprovedDisputePanel({
  dispute,
  version,
  payment,
  mailingJob,
  returnTo,
}: {
  dispute: DisputeRecord | null;
  version: DisputeVersionRecord | null;
  payment: PaymentRecord | null;
  mailingJob: MailingJobRecord | null;
  returnTo: string;
}) {
  if (!dispute || !version) {
    return (
      <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
        <div className="space-y-3">
          <p className="eyebrow">Certified mail approval</p>
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            No dispute is ready for mailing.
          </h3>
          <p className="text-sm leading-7 text-zinc-600">
            A dispute must exist and complete admin review before the mailing workflow can begin.
          </p>
        </div>
      </section>
    );
  }

  const meta = disputeWorkflowStatusMeta[dispute.workflowStatus];
  const canSendToProvider =
    (dispute.workflowStatus === "paid_ready_to_send" ||
      dispute.workflowStatus === "queued_for_send") &&
    isPaymentSettled(payment);

  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Certified mail approval</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            Deliberate mailing handoff.
          </h3>
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.tone}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-600">{meta.description}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
          <strong className="text-text-dark">Current version:</strong> v{version.versionNumber} ({version.kind.replaceAll("_", " ")})
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
          <strong className="text-text-dark">Payment:</strong> {payment ? paymentStatusLabels[payment.status] : "not requested"}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {dispute.processingStatus === "awaiting_admin_review" || dispute.processingStatus === "ai_generated" ? (
          <form method="POST" action={`/api/disputes/${dispute.id}/approve`}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
            >
              Approve For Mailing
            </button>
          </form>
        ) : null}

        {dispute.processingStatus === "approved" ? (
          <form method="POST" action={`/api/disputes/${dispute.id}/service-rendered`}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/45 hover:text-emerald-700"
            >
              Mark Service Rendered
            </button>
          </form>
        ) : null}

        {(dispute.workflowStatus === "approved_pending_pdf" ||
          dispute.workflowStatus === "awaiting_payment" ||
          dispute.workflowStatus === "paid_ready_to_send") ? (
          <form method="POST" action={`/api/disputes/${dispute.id}/pdf`}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
            >
              Generate Final PDF
            </button>
          </form>
        ) : null}

        {dispute.workflowStatus === "awaiting_payment" ? (
          <form method="POST" action={`/api/disputes/${dispute.id}/payment`}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
            >
              Create Payment Request
            </button>
          </form>
        ) : null}

        {(dispute.workflowStatus === "paid_ready_to_send" ||
          dispute.workflowStatus === "queued_for_send") ? (
          <form method="POST" action="/api/mailing/send">
            <input type="hidden" name="disputeId" value={dispute.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              disabled={!canSendToProvider}
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
            >
              Send To Certified Mail Provider
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
        <strong className="text-text-dark">Gating rule:</strong> no mailing job can be sent before admin approval,
        service-render confirmation, final PDF generation, and captured payment confirmation.
      </div>

      {!canSendToProvider &&
      (dispute.workflowStatus === "paid_ready_to_send" ||
        dispute.workflowStatus === "queued_for_send") ? (
        <div className="mt-4 rounded-[1.2rem] border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-900">
          Send is blocked until the $405 service fee is fully secured. If the prior authorization
          expired or failed, request an updated payment method before mailing.
        </div>
      ) : null}

      {mailingJob ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">Provider status:</strong> {mailingProviderStatusLabels[mailingJob.providerStatus]}
          </div>
          <div className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
            <strong className="text-text-dark">Tracking:</strong> {mailingJob.trackingNumber ?? "pending"}
          </div>
        </div>
      ) : null}
    </section>
  );
}
