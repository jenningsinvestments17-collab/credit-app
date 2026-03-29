import { Button } from "@/components/ui/Button";

const previewSteps = [
  {
    step: "01",
    title: "Open the file",
    copy:
      "Start intake, frame the credit problem, and see the exact path before you commit to the full workflow.",
  },
  {
    step: "02",
    title: "Upload what matters",
    copy:
      "Bring in all three bureau reports, valid ID, and proof of address so the case can move without guesswork.",
  },
  {
    step: "03",
    title: "Move into review",
    copy:
      "Once the file is complete, the portal shifts into AI review, admin review, approval, payment release, and certified mail.",
  },
];

const requiredDocs = [
  "Experian report",
  "Equifax report",
  "TransUnion report",
  "Valid ID",
  "Proof of address",
];

export function IntakePreviewSection() {
  return (
    <section className="section-light-soft soft-divider rounded-[2.25rem] border border-black/5 bg-light-fade p-6 shadow-panel md:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.9rem] border border-black/10 bg-white/80 p-6 md:p-8">
          <div className="space-y-4">
            <p className="eyebrow">Before you sign up</p>
            <h2 className="display-title-lg text-text-dark">
              See the intake before you step in.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-zinc-600">
              The platform shows the stages up front so clients know what documents are needed, what happens next, and why the process stays structured.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {previewSteps.map((item) => (
              <article
                key={item.step}
                className="rounded-[1.25rem] border border-black/10 bg-surface-light-soft p-4"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-display text-2xl uppercase tracking-[0.08em] text-[#7d6434]">
                    {item.step}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-7 text-zinc-700">{item.copy}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href="/intake">Start Intake</Button>
            <Button href="/book" variant="secondaryLight">
              Book a Call
            </Button>
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-white/10 bg-background-soft p-6 text-white shadow-panel md:p-8">
          <div className="space-y-4">
            <p className="eyebrow">Required documents</p>
            <h2 className="display-title text-4xl md:text-6xl">
              What the file needs.
            </h2>
            <p className="text-base leading-8 text-zinc-300">
              The process does not stay vague. Clients know upfront which documents unlock the real review and what cannot be skipped.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {requiredDocs.map((item) => (
              <div
                key={item}
                className="rounded-[1.1rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm uppercase tracking-[0.12em] text-zinc-200"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.2rem] border border-accent/20 bg-accent/10 px-4 py-4 text-sm leading-7 text-zinc-100">
            No upfront service fee. The client gets clarity on intake, uploads, review, and next steps before money becomes part of the release stage.
          </div>
        </article>
      </div>
    </section>
  );
}
