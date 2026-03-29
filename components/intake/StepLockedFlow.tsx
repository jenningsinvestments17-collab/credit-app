import type { IntakeExperienceModel } from "@/lib/services/intakeExperience";

function getStepStyles(status: "complete" | "active" | "locked") {
  if (status === "complete") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
  if (status === "active") {
    return "border-accent/30 bg-white/[0.07] text-white";
  }
  return "border-white/10 bg-black/20 text-zinc-400";
}

export function StepLockedFlow({ steps }: { steps: IntakeExperienceModel["steps"] }) {
  return (
    <div className="grid gap-4">
      {steps.map((step) => (
        <article key={step.id} className={`rounded-[1.3rem] border p-5 ${getStepStyles(step.status)}`}>
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 font-display text-2xl uppercase tracking-[0.08em]">
              {step.number}
            </span>
            <div className="space-y-2">
              <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em]">
                {step.title}
              </h3>
              <p className="text-sm leading-7">{step.copy}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
