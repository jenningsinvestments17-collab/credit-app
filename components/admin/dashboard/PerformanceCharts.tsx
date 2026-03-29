import type { AdminDashboardViewModel } from "@/types/adminDashboard";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function PerformanceCharts({ model }: { model: AdminDashboardViewModel }) {
  const maxRevenue = Math.max(...model.revenueSeries.map((item) => item.value), 1);
  const maxConversion = Math.max(...model.conversionTrend.map((item) => item.value), 1);

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
        <p className="eyebrow">Revenue over time</p>
        <div className="mt-6 flex h-56 items-end gap-3">
          {model.revenueSeries.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-44 w-full items-end rounded-[1rem] bg-white/[0.04] p-2">
                <div
                  className="w-full rounded-[0.8rem] bg-[linear-gradient(180deg,rgba(198,169,107,0.95),rgba(198,169,107,0.35))]"
                  style={{ height: `${Math.max(8, Math.round((point.value / maxRevenue) * 100))}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{point.label}</p>
                <p className="mt-1 text-xs text-zinc-300">{formatCurrency(point.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
        <p className="eyebrow">Conversion trend</p>
        <div className="mt-6 flex h-56 items-end gap-3">
          {model.conversionTrend.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-44 w-full items-end rounded-[1rem] bg-white/[0.04] p-2">
                <div
                  className="w-full rounded-[0.8rem] bg-[linear-gradient(180deg,rgba(56,189,248,0.95),rgba(56,189,248,0.28))]"
                  style={{ height: `${Math.max(8, Math.round((point.value / maxConversion) * 100))}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{point.label}</p>
                <p className="mt-1 text-xs text-zinc-300">{point.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
