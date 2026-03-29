import { Button } from "@/components/ui/Button";

const featuredResults = [
  {
    label: "Collection removals",
    value: "7 collections removed",
    copy:
      "A cleaner file can change how quickly pressure starts lifting and how realistic the next approval becomes.",
  },
  {
    label: "Consumer-rights recovery",
    value: "$100,000+ secured",
    copy:
      "Where appropriate, strong file review and escalation can support outcomes tied to consumer-rights recovery.",
  },
  {
    label: "Approval movement",
    value: "Better vehicle opportunity",
    copy:
      "Results are not only about removals. They are also about stronger everyday options opening back up.",
  },
  {
    label: "Ownership progress",
    value: "Closer to homeownership",
    copy:
      "Better credit positioning can move home, business, and lifestyle goals from distant to actionable.",
  },
];

const trustRows = [
  "Proof built around real movement, not vague promises",
  "Outcomes framed with professionalism and clarity",
  "Designed to make the next step feel more believable",
];

const quoteCards = [
  {
    quote:
      "The biggest change was finally seeing a process that felt organized and credible instead of chaotic.",
    person: "Client story placeholder",
  },
  {
    quote:
      "I could feel the shift because the file was being handled in a way that made every next step easier to understand.",
    person: "Client story placeholder",
  },
];

export default function ResultsPage() {
  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgba(198,169,107,0.14),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.35)_100%)]" />

        <div className="relative section-stack">
          <div className="section-intro">
            <div className="space-y-4">
              <p className="eyebrow">Results</p>
              <h1 className="display-title-lg text-text-dark">
                Proof in motion.
              </h1>
            </div>
            <p className="section-copy">
              Results matter because they make the future feel real again. This page
              shows the kind of movement stronger credit positioning can help create,
              while keeping the tone grounded, credible, and clear.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-5 md:grid-cols-2">
              {featuredResults.map((item, index) => (
                <article
                  key={item.value}
                  className={`rounded-[1.8rem] border p-6 shadow-panel md:p-7 ${
                    index < 2
                      ? "border-white/10 bg-background-soft text-white"
                      : "border-black/10 bg-white/78 text-text-dark"
                  }`}
                >
                  <p
                    className={`text-[11px] uppercase tracking-[0.22em] ${
                      index < 2 ? "text-accent" : "text-[#7d6434]"
                    }`}
                  >
                    {item.label}
                  </p>
                  <h2 className="mt-4 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] md:text-5xl">
                    {item.value}
                  </h2>
                  <p
                    className={`mt-4 text-base leading-8 ${
                      index < 2 ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid gap-5">
              <section className="panel-light">
                <div className="space-y-4">
                  <p className="eyebrow">Why this matters</p>
                  <h2 className="display-title text-3xl text-text-dark md:text-5xl">
                    Better credit should lead somewhere visible.
                  </h2>
                  <div className="grid gap-3">
                    {trustRows.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="panel-dark-soft">
                <div className="space-y-4">
                  <p className="eyebrow">Next step</p>
                  <h2 className="display-title text-3xl md:text-5xl">
                    Start with a review that keeps the file visible.
                  </h2>
                  <p className="text-sm leading-7 text-zinc-400">
                    The most useful next move is not guessing. It is starting the review
                    with a cleaner intake and a more structured path.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button href="/intake">Start Your Credit Review</Button>
                    <Button href="/book" variant="secondary">
                      Book Consultation
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {quoteCards.map((item) => (
              <article
                key={item.quote}
                className="rounded-[1.8rem] border border-black/10 bg-white/72 p-6 shadow-panel md:p-7"
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
    </div>
  );
}
