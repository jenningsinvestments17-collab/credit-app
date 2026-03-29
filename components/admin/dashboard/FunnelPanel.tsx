import type { AdminDashboardViewModel } from "@/types/adminDashboard";

export function FunnelPanel({ model }: { model: AdminDashboardViewModel }) {
  const maxUsers = Math.max(...model.funnel.map((step) => step.users), 1);

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
      <div className="space-y-3">
        <p className="eyebrow">Funnel</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Intake to mailed.
        </h3>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {model.funnel.map((step) => (
          <div key={step.step} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{step.label}</p>
            <p className="mt-3 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
              {step.users}
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(10, Math.round((step.users / maxUsers) * 100))}%` }}
              />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-rose-200">
              {step.dropOffPercentage}% drop-off
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
