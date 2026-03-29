import type { ClientDashboardModel } from "@/lib/services/clientDashboard";

export function MailingStatusCard({ model }: { model: ClientDashboardModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
      <div className="space-y-3">
        <p className="eyebrow">Mailing and tracking</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Certified mail movement.
        </h3>
        <p className="text-sm leading-7 text-zinc-300">
          The portal shows the release status, provider movement, and tracking here once the final dispute is mailed.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Workflow:</strong> {model.mailingSummary.workflowLabel}
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Provider:</strong> {model.mailingSummary.providerLabel}
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <strong className="text-white">Tracking:</strong> {model.mailingSummary.trackingLabel}
        </div>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
        {model.mailingSummary.note}
      </div>
    </section>
  );
}
