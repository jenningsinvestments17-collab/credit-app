import { Button } from "@/components/ui/Button";

const processSteps = [
  {
    step: "01",
    title: "Start intake",
    copy:
      "Begin with a clean entry point so the credit issue is understood before anything else gets layered on top.",
  },
  {
    step: "02",
    title: "Upload reports",
    copy:
      "Bring in Experian, Equifax, and TransUnion so the file review starts with real signal, not assumptions.",
  },
  {
    step: "03",
    title: "Sign and lock",
    copy:
      "Complete the required packet and permissions so the workflow opens in the right order and nothing gets skipped.",
  },
  {
    step: "04",
    title: "Move through review",
    copy:
      "Keep the case visible while the file is reviewed, structured, and prepared for the next operational step.",
  },
  {
    step: "05",
    title: "Disputes sent",
    copy:
      "Once review is complete, disputes move out with clean control and a better paper trail behind the file.",
  },
  {
    step: "06",
    title: "$405 due",
    copy:
      "The service fee comes due after services are rendered, which keeps the pricing clear and the offer easy to trust.",
  },
  {
    step: "07",
    title: "Upload responses",
    copy:
      "Bring bureau responses and receipts back into the portal so the case history stays organized and reviewable.",
  },
  {
    step: "08",
    title: "Reassessment",
    copy:
      "Review the updated file, identify what shifted, and decide whether the next move is complete or needs another pass.",
  },
];

const prepPoints = [
  "A visible 8-step process from intake to reassessment",
  "Clear upload checkpoints so clients know what comes next",
  "A workflow built to reduce guesswork and improve trust",
];

export default function HowItWorksPage() {
  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(198,169,107,0.14),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(198,169,107,0.04)_100%)]" />

        <div className="relative section-stack">
          <div className="section-intro">
            <div className="space-y-4">
              <p className="eyebrow">How it works</p>
              <h1 className="display-title-lg text-text-dark">
                Eight clear moves.
              </h1>
            </div>
            <p className="section-copy">
              This process is built to feel organized, visible, and easier to trust.
              The order stays the same from beginning to end so clients always know
              what this is, why it matters, and what comes next.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="panel-light">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="eyebrow">What to expect</p>
                  <h2 className="display-title text-3xl text-text-dark md:text-5xl">
                    Structured from the first move.
                  </h2>
                </div>

                <div className="grid gap-3">
                  {prepPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p className="text-sm leading-7 text-zinc-500">
                  The goal is not to overwhelm. It is to keep the file moving in the
                  right order while making the next action easy to understand.
                </p>
              </div>
            </section>

            <section className="panel-dark-soft">
              <div className="grid gap-4 md:grid-cols-2">
                {processSteps.map((step) => (
                  <article
                    key={step.step}
                    className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-display text-xl uppercase tracking-[0.08em] text-accent">
                        {step.step}
                      </div>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">{step.copy}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4 rounded-[1.8rem] border border-black/10 bg-white/72 p-6 md:flex-row md:items-center md:justify-between md:p-7">
            <div className="space-y-2">
              <p className="eyebrow">Start the process</p>
              <p className="text-base leading-8 text-zinc-700">
                If you are ready to begin, the next step is simple: start the intake
                and open the file the right way.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/intake">Start Your Credit Review</Button>
              <Button href="/book" variant="secondaryLight">
                Book Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
