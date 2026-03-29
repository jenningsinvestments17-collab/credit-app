import type { ClientDashboardModel } from "@/lib/services/clientDashboard";

function getStepStyles(status: ClientDashboardModel["journeySteps"][number]["status"]) {
  if (status === "complete") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
  if (status === "current") {
    return "border-accent/25 bg-accent/10 text-[#f2e0b5]";
  }
  return "border-white/10 bg-white/[0.04] text-zinc-400";
}

export function ClientJourneyPanel({ model }: { model: ClientDashboardModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Journey</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white md:text-5xl">
          The full process.
        </h2>
        <p className="text-base leading-8 text-zinc-300">
          This shows the full client path from intake to mailing, with your current position highlighted.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {model.journeySteps.map((step) => (
          <div key={step.id} className={`rounded-[1.25rem] border p-4 transition-all duration-200 hover:-translate-y-1 ${getStepStyles(step.status)}`}>
            <p className="text-[11px] uppercase tracking-[0.22em] opacity-80">{step.label}</p>
            <p className="mt-3 text-sm leading-7">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
