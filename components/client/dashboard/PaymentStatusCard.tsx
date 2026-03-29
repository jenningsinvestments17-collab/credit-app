import type { ClientDashboardViewModel } from "@/types/dashboard";

export function PaymentStatusCard({ model }: { model: ClientDashboardViewModel }) {
  if (!model.showPaymentCard || !model.dispute) {
    return null;
  }

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
      <div className="space-y-3">
        <p className="eyebrow">Payment status</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          No upfront fee. Payment only after service.
        </h3>
        <p className="text-sm leading-7 text-zinc-300">{model.paymentSummary.note}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Workflow:</strong> {model.mailingSummary.workflowLabel}
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Amount:</strong> {model.paymentSummary.amountLabel}
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Payment:</strong> {model.paymentSummary.statusLabel}
        </div>
      </div>

      {model.paymentActionHref ? (
        <div className="mt-5">
          <a
            href={model.paymentActionHref}
            className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/60 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
          >
            {model.paymentActionLabel ?? "Pay Now"}
          </a>
        </div>
      ) : null}
    </section>
  );
}
