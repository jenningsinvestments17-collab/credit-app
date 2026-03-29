import { Button } from "@/components/ui/Button";
import type { ClientDashboardViewModel } from "@/types/dashboard";

export function HeroStatusPanel({ model }: { model: ClientDashboardViewModel }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.18),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_55%)]" />
      <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">Current step</p>
            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-accent">
              Step {model.stepNumber} of {model.totalSteps}
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-[0.03em] text-white md:text-5xl">
              {model.currentStepTitle}
            </h2>
            <p className="max-w-2xl text-base leading-8 text-zinc-300">
              {model.currentStepSummary}
            </p>
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
              {model.statusBarLabel} • {model.statusProblem}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              <span>Progress locked to your live workflow</span>
              <span>{model.progressPercent}% complete</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#c6a96b_0%,#f1ddb2_100%)] shadow-[0_0_30px_rgba(198,169,107,0.35)] transition-all duration-500"
                style={{ width: `${model.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Next move</p>
          <h3 className="mt-3 font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-white">
            {model.primaryAction.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            {model.primaryAction.description}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button href={model.primaryAction.href}>{model.primaryAction.ctaLabel}</Button>
            <Button href="/dashboard/contracts" variant="secondary">
              Contracts
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
