import type { buildAdminProfitDashboard } from "@/lib/services/adminProfitDashboard";

type ProfitModel = Awaited<ReturnType<typeof buildAdminProfitDashboard>>;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProfitTrendCharts({ model }: { model: ProfitModel }) {
  const revenueMax = Math.max(...model.revenueSeries.map((point) => point.totalCents), 1);
  const conversionMax = Math.max(...model.conversionTrend.map((point) => point.conversionRate), 1);

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
        <p className="eyebrow">Revenue over time</p>
        <div className="mt-6 flex min-h-[18rem] items-end gap-3">
          {model.revenueSeries.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-56 w-full items-end rounded-[1rem] bg-white/[0.04] px-2 pb-2">
                <div
                  className="w-full rounded-[0.85rem] bg-[linear-gradient(180deg,#e9d3a4_0%,#c6a96b_100%)] shadow-[0_0_20px_rgba(198,169,107,0.18)]"
                  style={{ height: `${Math.max(10, (point.totalCents / revenueMax) * 100)}%` }}
                  title={formatCurrency(point.totalCents)}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{point.label}</p>
                <p className="mt-1 text-sm text-zinc-200">{formatCurrency(point.totalCents)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
        <p className="eyebrow">Conversion trend</p>
        <div className="mt-6 flex min-h-[18rem] items-end gap-3">
          {model.conversionTrend.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-56 w-full items-end rounded-[1rem] bg-white/[0.04] px-2 pb-2">
                <div
                  className="w-full rounded-[0.85rem] bg-[linear-gradient(180deg,#7dd3fc_0%,#0ea5e9_100%)] shadow-[0_0_20px_rgba(14,165,233,0.16)]"
                  style={{ height: `${Math.max(10, (point.conversionRate / conversionMax) * 100)}%` }}
                  title={`${point.conversionRate}%`}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{point.label}</p>
                <p className="mt-1 text-sm text-zinc-200">{point.conversionRate}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
