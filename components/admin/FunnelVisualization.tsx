import type { buildAdminProfitDashboard } from "@/lib/services/adminProfitDashboard";

type ProfitModel = Awaited<ReturnType<typeof buildAdminProfitDashboard>>;

export function FunnelVisualization({ model }: { model: ProfitModel }) {
  const maxUsers = Math.max(...model.funnel.map((step) => step.users), 1);

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
      <div className="space-y-3">
        <p className="eyebrow">Funnel</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Intake to mailed.
        </h3>
      </div>

      <div className="mt-6 grid gap-4">
        {model.funnel.map((step) => (
          <div key={step.step} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold uppercase tracking-[0.08em] text-white">{step.label}</p>
                <p className="text-sm leading-7 text-zinc-400">{step.users} reached</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                step.dropOffPercentage >= 40
                  ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
                  : step.dropOffPercentage >= 20
                    ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              }`}>
                {step.dropOffPercentage}% drop-off
              </span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#c6a96b_0%,#e9d3a4_100%)] shadow-[0_0_18px_rgba(198,169,107,0.28)]"
                style={{ width: `${Math.max(10, (step.users / maxUsers) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
