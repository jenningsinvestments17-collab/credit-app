import type { DisputeRecord, MailingJobRecord, PaymentRecord } from "@/lib/types";
import {
  mailingProviderStatusLabels,
  mailingStatusLabels,
  paymentStatusLabels,
} from "@/lib/ui/statusLabels";

export function MailingPaymentCard({
  dispute,
  payment,
  mailingJob,
}: {
  dispute: DisputeRecord | null;
  payment: PaymentRecord | null;
  mailingJob: MailingJobRecord | null;
}) {
  if (
    !dispute ||
    !payment ||
    ![
      "payment_required",
      "authorization_expired",
      "payment_failed",
      "payment_not_collected",
      "authorized",
      "ready_to_capture",
      "captured",
    ].includes(payment.status)
  ) {
    return null;
  }

  const actionHref = payment.updatePaymentMethodUrl ?? payment.checkoutUrl;
  const actionLabel =
    payment.status === "payment_failed" || payment.status === "authorization_expired"
      ? "Update Card"
      : "Pay Now";

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
      <div className="space-y-3">
        <p className="eyebrow">Payment status</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          No upfront fee. Payment only after service.
        </h3>
        <p className="text-sm leading-7 text-zinc-300">
          The $405 service release only appears after your dispute is reviewed, approved,
          and ready for final certified mail. That keeps the process fair for the client and protected for the business.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Workflow:</strong>{" "}
          {mailingStatusLabels[dispute.workflowStatus]}
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Amount:</strong> $405 service release
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Payment:</strong>{" "}
          {paymentStatusLabels[payment.status]}
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300 sm:col-span-3">
          <strong className="text-white">Mailing gate:</strong>{" "}
          {mailingJob ? mailingProviderStatusLabels[mailingJob.providerStatus] : "waiting on release"}
        </div>
      </div>

      {payment?.status === "payment_required" ||
      payment?.status === "authorization_expired" ||
      payment?.status === "payment_failed" ||
      payment?.status === "payment_not_collected" ? (
        <div className="mt-5 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-100">
          Payment is required before the final mailing step can continue.
          {payment.updatePaymentMethodUrl ? (
            <>
              {" "}Use{" "}
              <a className="font-semibold text-white underline decoration-accent/60 underline-offset-4" href={payment.updatePaymentMethodUrl}>
                this secure payment link
              </a>{" "}
              to update your payment method. Mailing stays blocked until payment is valid again.
            </>
          ) : null}
        </div>
      ) : null}

      {(payment?.status === "authorized" ||
        payment?.status === "ready_to_capture" ||
        payment?.status === "captured") ? (
        <div className="mt-5 rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-100">
          Your payment method is secured for the final service step.
          {payment.authorizationExpiresAt
            ? ` Authorization currently expires ${new Date(payment.authorizationExpiresAt).toLocaleString()}.`
            : null}
        </div>
      ) : null}

      {actionHref ? (
        <div className="mt-5">
          <a
            href={actionHref}
            className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/60 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
          >
            {actionLabel}
          </a>
        </div>
      ) : null}
    </section>
  );
}
