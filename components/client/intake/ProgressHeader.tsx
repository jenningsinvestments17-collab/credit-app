import type { IntakeViewModel } from "@/types/intake";

export function ProgressHeader({ model }: { model: IntakeViewModel }) {
  const currentIndex = model.progressSteps.findIndex((step) => step.id === model.requestedStep);
  const percent = Math.round(((Math.max(currentIndex, 0) + 1) / model.progressSteps.length) * 100);

  return (
    <section className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="eyebrow">Onboarding progress</p>
          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
            {model.progressSteps.find((step) => step.id === model.requestedStep)?.title}
          </h2>
          <p className="text-sm leading-7 text-zinc-300">
            Resume route: {model.resumeHref.replace("/intake/", "").replace("/", "") || "profile"}.
          </p>
        </div>
        <div className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-accent">
          {percent}% through intake
        </div>
      </div>

      <div className="mt-5 h-3 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#c6a96b_0%,#f1ddb2_100%)]" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
