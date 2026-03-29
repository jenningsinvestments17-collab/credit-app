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

export function AdminProfitDashboardPanel({ model }: { model: ProfitModel }) {
  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Profit dashboard</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark md:text-5xl">
          Revenue, funnel pressure, and who is ready to pay.
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          This view uses live PostgreSQL-backed analytics and payment snapshots so admin can act on real cashflow and drop-off risk.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue today" value={formatCurrency(model.revenueTodayCents)} />
        <MetricCard label="Revenue week" value={formatCurrency(model.revenueWeekCents)} />
        <MetricCard label="Pending payments" value={String(model.pendingPaymentCount)} />
        <MetricCard label="Avg. hours to payment" value={model.avgHoursToPayment ? String(model.avgHoursToPayment) : "--"} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-5">
          <p className="eyebrow">Funnel drop-off</p>
          <div className="mt-4 grid gap-3">
            {model.funnel.map((step) => (
              <div key={step.step} className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">{step.label}</p>
                    <p className="text-sm leading-7 text-zinc-600">{step.users} reached this stage</p>
                  </div>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-700">
                    {step.dropOffPercentage}% drop-off
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4">
              <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">Account to paid conversion</p>
              <p className="mt-2 text-sm leading-7 text-zinc-700">{model.conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-5">
          <p className="eyebrow">Revenue queue</p>
          <div className="mt-4 grid gap-3">
            {model.revenueQueue.length ? (
              model.revenueQueue.map((item: RevenueQueueItem) => (
                <div key={item.disputeId} className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">{item.userName}</p>
                      <p className="text-sm leading-7 text-zinc-600">{item.userEmail}</p>
                      <p className="text-sm leading-7 text-zinc-700">
                        {formatCurrency(item.amountCents)} | waiting {item.waitingHours}h | {item.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.userId ? (
                        <form method="POST" action="/api/admin/notifications/reminder">
                          <input type="hidden" name="userId" value={item.userId} />
                          <input type="hidden" name="reason" value="payment_required" />
                          <input type="hidden" name="returnTo" value="/admin" />
                          <button type="submit" className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-dark">
                            Send reminder
                          </button>
                        </form>
                      ) : null}
                      <form method="POST" action={`/api/disputes/${item.disputeId}/approve`}>
                        <input type="hidden" name="returnTo" value="/admin" />
                        <button type="submit" className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-dark">
                          Approve dispute
                        </button>
                      </form>
                      <form method="POST" action={`/api/disputes/${item.disputeId}/escalation`}>
                        <input type="hidden" name="mode" value="advance" />
                        <input type="hidden" name="returnTo" value="/admin" />
                        <button type="submit" className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-dark">
                          Escalate
                        </button>
                      </form>
                      <form method="POST" action={`/api/disputes/${item.disputeId}/payment`}>
                        <input type="hidden" name="returnTo" value="/admin" />
                        <button type="submit" className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-dark">
                          Mark service rendered
                        </button>
                      </form>
                      <a href={`/admin/leads/${item.leadId}`} className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-dark">
                        Open case
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-600">
                No pending revenue queue right now.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <AlertColumn title="Unpaid and failed payments" items={[...model.alerts.unpaid, ...model.alerts.failedPayments]} />
        <AlertColumn title="Missing docs and stalled cases" items={[...model.alerts.missingDocs, ...model.alerts.stalledCases]} />
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">{value}</p>
    </div>
  );
}

function AlertColumn({
  title,
  items,
}: {
  title: string;
  items: Array<Record<string, unknown>>;
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-5">
      <p className="eyebrow">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
              {Object.values(item).filter(Boolean).join(" | ")}
            </div>
          ))
        ) : (
          <div className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-600">
            No active alerts in this section.
          </div>
        )}
      </div>
    </div>
  );
}
