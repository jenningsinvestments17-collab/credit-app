type WorkflowStepProps = {
  step: string;
  title: string;
  copy: string;
  tone?: "dark" | "light";
};

export function WorkflowStep({
  step,
  title,
  copy,
  tone = "dark",
}: WorkflowStepProps) {
  return (
    <article
      className={`rounded-[1.35rem] border p-5 ${
        tone === "dark"
          ? "border-white/10 bg-white/[0.04]"
          : "border-black/10 bg-white/72"
      }`}
    >
      <div className="mb-4 flex items-center gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-display text-xl uppercase tracking-[0.08em] text-accent">
          {step}
        </div>
        <span className={`h-px flex-1 ${tone === "dark" ? "bg-white/10" : "bg-black/10"}`} />
      </div>
      <h3
        className={`font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] ${
          tone === "dark" ? "text-white" : "text-text-dark"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-3 text-sm leading-7 ${
          tone === "dark" ? "text-zinc-400" : "text-zinc-600"
        }`}
      >
        {copy}
      </p>
    </article>
  );
}
