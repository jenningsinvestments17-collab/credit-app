import { Button } from "@/components/ui/Button";

const trustPoints = [
  "No upfront service fee before the work is rendered",
  "3-bureau workflow with secure upload gating",
  "AI draft generation with admin review before release",
  "Certified-mail movement tracked inside the platform",
];

const afterSignup = [
  "Create your account and enter the portal",
  "Complete intake and upload the required reports",
  "The file moves into AI review, admin review, and final mailing control",
];

export function TrustSection() {
  return (
    <section className="section-light soft-divider p-6 md:p-8">
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[1.9rem] border border-black/10 bg-white/80 p-6 shadow-panel md:p-8">
          <div className="space-y-4">
            <p className="eyebrow">Trust and credibility</p>
            <h2 className="display-title-lg text-text-dark">
              Aggressive process. Clear control.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-zinc-600">
              The platform is built to feel sharp and serious, but the flow still stays transparent. Clients can see what is required, what is happening, and what comes next.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {trustPoints.map((item) => (
              <div
                key={item}
                className="rounded-[1.15rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-white/10 bg-background-soft p-6 text-white shadow-panel md:p-8">
          <div className="space-y-4">
            <p className="eyebrow">What happens after signup</p>
            <h2 className="display-title text-4xl md:text-6xl">
              No uncertainty.
            </h2>
            <p className="text-base leading-8 text-zinc-300">
              After signup, the client is not dropped into random screens. The platform walks them into intake, documents, review, and the next controlled step.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {afterSignup.map((item, index) => (
              <article
                key={item}
                className="rounded-[1.2rem] border border-white/10 bg-white/[0.05] p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
                  After signup {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-200">{item}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href="/intake">Start Intake</Button>
            <Button href="/book" variant="secondary">
              Book a Call
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
