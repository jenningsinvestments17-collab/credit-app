import type { buildAdminProfitDashboard } from "@/lib/services/adminProfitDashboard";

type ProfitModel = Awaited<ReturnType<typeof buildAdminProfitDashboard>>;

export function AdminAlertCenter({ model }: { model: ProfitModel }) {
  const groups = [
    { title: "Payment failed", items: model.alerts.failedPayments, tone: "rose" },
    { title: "Missing docs", items: model.alerts.missingDocs, tone: "amber" },
    { title: "Stalled cases", items: model.alerts.stalledCases, tone: "sky" },
  ] as const;

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
      <div className="space-y-3">
        <p className="eyebrow">Alert center</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Pressure points.
        </h3>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{group.title}</p>
            <div className="mt-3 grid gap-3">
              {group.items.length ? (
                group.items.map((item, index) => (
                  <div
                    key={`${group.title}-${index}`}
                    className={`rounded-[1rem] border px-3 py-3 text-sm leading-7 ${
                      group.tone === "rose"
                        ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
                        : group.tone === "amber"
                          ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
                          : "border-sky-400/20 bg-sky-500/10 text-sky-100"
                    }`}
                  >
                    {Object.values(item).filter(Boolean).join(" | ")}
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-3 text-sm leading-7 text-zinc-400">
                  No active alerts.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
