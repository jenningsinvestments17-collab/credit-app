import { Button } from "@/components/ui/Button";

const steps = [
  {
    title: "Start intake",
    copy: "Open the file, see the path, and frame the credit problem without the usual confusion.",
    step: "01",
  },
  {
    title: "Upload the file",
    copy: "Bring in all 3 bureau reports, ID, and proof of address so the case can move on real signal.",
    step: "02",
  },
  {
    title: "Move through review",
    copy: "The system moves the file through AI review, admin review, approval, and final mailing control.",
    step: "03",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-light-soft soft-divider p-6 md:p-8">
      <div className="section-stack">
        <div className="section-intro">
          <div className="space-y-4">
            <p className="eyebrow">How it works</p>
            <h2 className="display-title-lg">Eight clear moves.</h2>
          </div>
          <p className="section-copy">
            The process stays visible from intake to reassessment. Same flow, same order, stronger trust, and no confusion about when money is due.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.step}
              className={`rounded-[1.8rem] border p-6 shadow-panel transition-colors duration-200 md:p-7 ${
                index === 1
                  ? "border-white/10 bg-background-soft text-white"
                  : "border-black/10 bg-white/68 text-text-dark"
              }`}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-display text-2xl uppercase tracking-[0.08em] text-[#7d6434]">
                  {step.step}
                </span>
                <span
                  className={`h-px flex-1 ${
                    index === 1 ? "bg-white/10" : "bg-black/10"
                  }`}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-display break-words text-3xl uppercase leading-[0.92] tracking-[0.03em] [overflow-wrap:anywhere] md:text-[2rem]">
                  {step.title}
                </h3>
                <p
                  className={`text-base leading-8 ${
                    index === 1 ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {step.copy}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-[1.8rem] border border-black/10 bg-white/62 p-6 md:flex-row md:items-center md:justify-between md:p-7">
          <div className="space-y-2">
            <p className="eyebrow">Ready to start</p>
            <p className="text-base leading-8 text-zinc-700">
              A clear process builds trust. No upfront service fee, cleaner next steps, and a stronger handoff from client portal to admin review.
            </p>
          </div>
          <Button href="/intake">Start Your Credit Review</Button>
        </div>
      </div>
    </section>
  );
}
