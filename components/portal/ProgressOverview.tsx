import type { ClientProgress } from "@/lib/types";

export function ProgressOverview({ progress }: { progress: ClientProgress }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-background-soft p-6 text-white shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Current progress</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em]">
          {progress.currentStepLabel}
        </h2>
          <p className="text-sm leading-7 text-zinc-400">
            Your portal keeps the workflow visible so you can return without restarting.
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          Step {progress.currentStepNumber} of {progress.totalSteps}
        </p>

      <div className="mt-5 h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${progress.completionPercent}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {progress.completedSteps.map((step) => (
          <span
            key={step}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400"
          >
            {step.replaceAll("_", " ")}
          </span>
        ))}
      </div>
    </section>
  );
}
