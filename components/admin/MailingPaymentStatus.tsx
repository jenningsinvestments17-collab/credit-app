import type { PaymentRecord } from "@/lib/types";
import { paymentStatusLabels } from "@/lib/ui/statusLabels";
import { isPaymentAuthorized, isPaymentSettled } from "@/lib/stripe/service";

export function MailingPaymentStatus({
  payment,
  disputeId,
  returnTo,
}: {
  payment: PaymentRecord | null;
  disputeId: string;
  returnTo: string;
}) {
  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Mailing payment</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            Payment gate before provider send.
          </h3>
          <span className="inline-flex rounded-full border border-sky-400/25 bg-sky-500/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-700">
            Stripe Preauthorization $405
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-600">
          The system re-checks payment validity before final service release so certified mail
          does not move forward on an expired or failed payment method.
        </p>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
        <strong className="text-text-dark">Status:</strong>{" "}
        {payment ? paymentStatusLabels[payment.status] : "not requested"} {" | "}
        <strong className="text-text-dark">Amount:</strong> $
        {(payment?.amountCents ?? 40500) / 100}
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-sky-400/20 bg-sky-500/10 px-4 py-4 text-sm leading-7 text-sky-950">
        <strong>Stripe preauthorization:</strong>{" "}
        {isPaymentSettled(payment)
          ? "captured and secured"
          : isPaymentAuthorized(payment)
            ? "authorized and ready for final capture"
            : "not secured yet"}
        {" | "}
        <strong>$405 service fee</strong> must be authorized or captured before certified mail can be released.
      </div>

      {payment ? (
        <div className="mt-4 rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
          Failed attempts: {payment.retryCount ?? 0} {" | "} Client update needed:{" "}
          {payment.clientActionRequired ? "yes" : "no"}
          {payment.authorizationExpiresAt
            ? ` | Auth expires ${new Date(payment.authorizationExpiresAt).toLocaleString()}`
            : null}
          {payment.lastFailureReason ? ` | Last issue: ${payment.lastFailureReason}` : null}
        </div>
      ) : null}

      {!payment ||
      payment.status === "payment_not_collected" ||
      payment.status === "payment_required" ||
      payment.status === "authorization_expired" ||
      payment.status === "payment_failed" ? (
        <form method="POST" action={`/api/disputes/${disputeId}/payment`} className="mt-5">
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
          >
            {payment?.clientActionRequired
              ? "Request Updated Card For $405 Preauthorization"
              : "Create Stripe $405 Preauthorization"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
