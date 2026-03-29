import { Button } from "@/components/ui/Button";

const proofCards = [
  {
    label: "Collections removed",
    value: "7 collections removed",
    copy:
      "Placeholder result card for a client file that shifted from pressure into cleaner credit visibility.",
  },
  {
    label: "Consumer-rights recovery",
    value: "$100,000+ recovered",
    copy:
      "Placeholder trust proof for settlement and consumer-rights outcomes tied to strong file review and escalation.",
  },
  {
    label: "Vehicle opportunity",
    value: "Approved for better terms",
    copy:
      "A cleaner file can create better leverage for transportation, financing, and everyday mobility decisions.",
  },
  {
    label: "Ownership progress",
    value: "Closer to homeownership",
    valueClassName:
      "whitespace-nowrap text-[2rem] sm:text-[2.2rem] md:text-[2.15rem] xl:text-[2.8rem]",
    copy:
      "Proof that better credit is not abstract. It changes what becomes reachable in real life.",
  },
];

const testimonialCards = [
  {
    quote:
      "The process finally felt visible. I was not guessing anymore, and that changed how I moved.",
    person: "Client story placeholder",
  },
  {
    quote:
      "What stood out most was how clear everything felt. The results mattered, but the structure mattered too.",
    person: "Client story placeholder",
  },
];

const trustItems = [
  "Client wins tracked with clarity",
  "Consumer-rights outcomes where appropriate",
  "Approval momentum tied to better credit positioning",
  "Built to show real movement, not vague promises",
];

export function ResultsSection() {
  return (
    <section className="section-light soft-divider relative overflow-hidden p-6 md:p-8">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(198,169,107,0.14),transparent_58%)]" />

      <div className="section-stack relative">
        <div className="section-intro">
          <div className="space-y-4">
            <p className="eyebrow">Real results</p>
            <h2 className="display-title-lg">Proof in motion.</h2>
          </div>
          <p className="section-copy">
            Better credit should feel visible in real outcomes. This section is built
            to show movement, trust, and transformation without turning the page into
            a cheap stats wall.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5 md:grid-cols-2">
            {proofCards.map((card, index) => (
              <article
                key={card.value}
                className={`rounded-[1.9rem] border p-6 shadow-panel transition-colors duration-200 md:p-7 ${
                  index < 2
                    ? "border-white/10 bg-background-soft text-white"
                    : "border-black/10 bg-white/78 text-text-dark"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    index < 2 ? "text-accent" : "text-[#7d6434]"
                  }`}
                >
                  {card.label}
                </p>
                <h3
                  className={`mt-4 break-words font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] [overflow-wrap:anywhere] md:text-5xl ${
                    card.valueClassName ?? ""
                  }`}
                >
                  {card.value}
                </h3>
                <p
                  className={`mt-4 text-base leading-8 ${
                    index < 2 ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {card.copy}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-5">
            <article className="rounded-[1.9rem] border border-black/10 bg-white/78 p-6 shadow-panel md:p-7">
              <p className="eyebrow">Trust signals</p>
              <div className="mt-5 grid gap-3">
                {trustItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.9rem] border border-accent/20 bg-accent/10 p-6 shadow-panel md:p-7">
              <p className="eyebrow">Ready to start</p>
              <h3 className="mt-3 font-display break-words text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark [overflow-wrap:anywhere]">
                Start the review before the next opportunity passes by.
              </h3>
              <p className="mt-4 text-base leading-8 text-zinc-700">
                Keep the journey moving from pressure into stronger options with a
                clean intake path and a more visible process.
              </p>
              <div className="mt-6">
                <Button href="/intake">Start Your Credit Review</Button>
              </div>
            </article>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {testimonialCards.map((item) => (
            <article
              key={item.quote}
                className="rounded-[1.9rem] border border-black/10 bg-white/70 p-6 shadow-panel md:p-7"
            >
              <p className="text-lg leading-8 text-zinc-700">"{item.quote}"</p>
              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                {item.person}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
