import type { buildAnalyticsDashboardModel } from "@/lib/services/analytics";

type AnalyticsModel = Awaited<ReturnType<typeof buildAnalyticsDashboardModel>>;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function AnalyticsOverviewPanel({ model }: { model: AnalyticsModel }) {
  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Analytics</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark md:text-5xl">
          Funnel, revenue, and completion pace.
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          This view measures the real milestones tracked from the service layer without storing raw client PII in analytics.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Accounts created</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.totalUsers}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Revenue tracked</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {formatCurrency(model.revenueCents)}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Payments completed</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.paymentsCompleted}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Avg. hours to mailed</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.avgHoursToCompletion ?? "--"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-5">
          <p className="eyebrow">Conversion funnel</p>
          <div className="mt-4 grid gap-3">
            {model.funnel.map((step) => (
              <div
                key={step.eventType}
                className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                      {step.label}
                    </p>
                    <p className="text-sm leading-7 text-zinc-600">
                      {step.users} users | {step.conversionRate}% conversion
                    </p>
                  </div>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-700">
                    {step.dropOffRate}% drop-off
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-black/8">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${step.conversionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-5">
          <p className="eyebrow">Current funnel stages</p>
          <div className="mt-4 grid gap-3">
            {model.currentStageCounts.map((stage) => (
              <div
                key={stage.stage}
                className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                    {stage.stage.replaceAll("_", " ")}
                  </p>
                  <span className="text-sm leading-7 text-zinc-700">{stage.users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
