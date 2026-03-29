import { Button } from "@/components/ui/Button";
import type { ClientDashboardModel } from "@/lib/services/clientDashboard";

export function CurrentStepCard({ model }: { model: ClientDashboardModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-background-soft p-6 text-white shadow-panel md:p-7">
      <div className="space-y-4">
        <p className="eyebrow">Current step</p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] md:text-5xl">
            {model.currentStepTitle}
          </h2>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
            Step {model.stepNumber} of {model.totalSteps}
          </span>
        </div>
        <p className="text-base leading-8 text-zinc-300">{model.currentStepSummary}</p>
        <p className="text-sm leading-7 text-zinc-400">
          {model.statusBarLabel}. {model.statusProblem}
        </p>
      </div>

      <div className="mt-6 h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${model.progressPercent}%` }}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button href={model.nextStepHref}>Continue</Button>
        <Button href="/dashboard/contracts" variant="secondary">
          Contracts
        </Button>
      </div>
    </section>
  );
}
