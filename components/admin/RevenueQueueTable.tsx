import type { buildAdminProfitDashboard } from "@/lib/services/adminProfitDashboard";

type ProfitModel = Awaited<ReturnType<typeof buildAdminProfitDashboard>>;
type RevenueQueueItem = ProfitModel["revenueQueue"][number];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function RevenueQueueTable({ model }: { model: ProfitModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
      <div className="space-y-3">
        <p className="eyebrow">Revenue queue</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Ready to pay.
        </h3>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-white/10">
        <div className="hidden grid-cols-[1.2fr_0.7fr_0.7fr_1fr] gap-3 bg-white/[0.05] px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500 md:grid">
          <span>Client</span>
          <span>Amount</span>
          <span>Waiting</span>
          <span>Actions</span>
        </div>
        <div className="grid divide-y divide-white/10">
          {model.revenueQueue.length ? (
            model.revenueQueue.map((item: RevenueQueueItem) => (
              <QueueRow key={item.disputeId} item={item} />
            ))
          ) : (
            <div className="px-4 py-6 text-sm leading-7 text-zinc-400">No pending payment queue right now.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function QueueRow({ item }: { item: RevenueQueueItem }) {
  return (
    <div className="grid gap-4 bg-white/[0.03] px-4 py-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_1fr] md:items-center">
      <div className="space-y-1">
        <p className="font-semibold uppercase tracking-[0.08em] text-white">{item.userName}</p>
        <p className="text-sm leading-7 text-zinc-400">{item.userEmail || "Email not available"}</p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 md:hidden">{item.status.replaceAll("_", " ")}</p>
      </div>
      <div className="text-sm leading-7 text-zinc-200">{formatCurrency(item.amountCents)}</div>
      <div className="text-sm leading-7 text-zinc-300">{item.waitingHours}h</div>
      <div className="flex flex-wrap gap-2">
        {item.userId ? (
          <form method="POST" action="/api/admin/notifications/reminder">
            <input type="hidden" name="userId" value={item.userId} />
            <input type="hidden" name="reason" value="payment_required" />
            <input type="hidden" name="returnTo" value="/admin" />
            <button type="submit" className="rounded-full border border-accent/25 bg-accent/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/18">
              Send reminder
            </button>
          </form>
        ) : null}
        <form method="POST" action={`/api/disputes/${item.disputeId}/escalation`}>
          <input type="hidden" name="mode" value="advance" />
          <input type="hidden" name="returnTo" value="/admin" />
          <button type="submit" className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-fuchsia-200 transition-colors hover:bg-fuchsia-500/18">
            Escalate
          </button>
        </form>
      </div>
    </div>
  );
}
