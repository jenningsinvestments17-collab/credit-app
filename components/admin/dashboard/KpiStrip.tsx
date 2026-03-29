import type { AdminDashboardViewModel } from "@/types/adminDashboard";

const toneMap = {
  emerald: "text-emerald-300",
  accent: "text-accent",
  sky: "text-sky-300",
  amber: "text-amber-300",
  fuchsia: "text-fuchsia-300",
} as const;

export function KpiStrip({ model }: { model: AdminDashboardViewModel }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {model.kpis.map((item) => (
        <div
          key={item.id}
          className="group rounded-[1.5rem] border border-white/10 bg-[#121215]/92 p-5 text-white shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_18px_50px_rgba(198,169,107,0.12)]"
        >
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{item.label}</p>
          <p className={`mt-3 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] ${toneMap[item.tone]}`}>
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
