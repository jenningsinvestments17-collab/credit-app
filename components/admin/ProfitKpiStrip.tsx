import type { buildAdminProfitDashboard } from "@/lib/services/adminProfitDashboard";

type ProfitModel = Awaited<ReturnType<typeof buildAdminProfitDashboard>>;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProfitKpiStrip({ model }: { model: ProfitModel }) {
  const kpis = [
    { label: "Revenue today", value: formatCurrency(model.revenueTodayCents), tone: "text-emerald-300" },
    { label: "Revenue week", value: formatCurrency(model.revenueWeekCents), tone: "text-accent" },
    { label: "Conversion", value: `${model.conversionRate}%`, tone: "text-sky-300" },
    { label: "Pending payments", value: String(model.pendingPaymentCount), tone: "text-amber-300" },
    { label: "Avg. hours to payment", value: model.avgHoursToPayment ? `${model.avgHoursToPayment}h` : "--", tone: "text-fuchsia-300" },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {kpis.map((item) => (
        <div
          key={item.label}
          className="group rounded-[1.5rem] border border-white/10 bg-[#121215]/92 p-5 text-white shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_18px_50px_rgba(198,169,107,0.12)]"
        >
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{item.label}</p>
          <p className={`mt-3 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] ${item.tone}`}>
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
