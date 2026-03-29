type ProgressTrackerProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
};

export function ProgressTracker({
  currentStep,
  totalSteps,
  label,
}: ProgressTrackerProps) {
  const width = `${Math.max(0, Math.min(100, (currentStep / totalSteps) * 100))}%`;

  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">{label}</p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width }} />
      </div>
    </div>
  );
}
