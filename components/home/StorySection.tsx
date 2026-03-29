const storySteps = [
  {
    title: "Own More",
    subtitle: "From approvals to ownership.",
    copy:
      "Better credit changes the way doors open. Homes, keys, approvals, and ownership all start feeling closer instead of always delayed.",
    index: "01",
  },
  {
    title: "Build More",
    subtitle: "Launch businesses with confidence.",
    copy:
      "When credit pressure loosens, the next move becomes easier to back. New business steps feel more possible when the file stops working against you.",
    index: "02",
  },
  {
    title: "Move Different",
    subtitle: "Drive. Travel. Elevate.",
    copy:
      "Movement expands when access improves. Vehicles, travel, and everyday flexibility start to feel like options again, not distant upgrades.",
    index: "03",
  },
  {
    title: "Live Better",
    subtitle: "Access changes everything.",
    copy:
      "The real shift is freedom. Better credit supports bigger choices, cleaner momentum, and a life that feels more open than restricted.",
    index: "04",
  },
];

export function StorySection() {
  return (
    <section className="section-story soft-divider rounded-[2.25rem] border border-black/5 bg-light-fade p-6 text-text-dark shadow-panel md:p-8">
      <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-10">
        <div className="md:sticky md:top-28 md:self-start">
          <div className="section-light min-h-[26rem] overflow-hidden bg-[radial-gradient(circle_at_76%_18%,rgba(198,169,107,0.22),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(231,229,228,0.94)_100%)] p-8">
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-4">
                <p className="eyebrow">What better credit unlocks</p>
                <h2 className="display-title-lg break-words [overflow-wrap:anywhere]">
                  From pressure
                  <br />
                  to freedom.
                </h2>
                <p className="max-w-md text-base leading-8 text-zinc-600">
                  Ownership, business, movement, and lifestyle all sit on the other side
                  of stronger credit positioning.
                </p>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-black/10 bg-white/70 p-5">
                <div className="grid gap-4">
                  <div className="story-visual-band">
                    <span>Ownership</span>
                    <span>Business</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[1.25rem] border border-black/10 bg-[linear-gradient(145deg,rgba(198,169,107,0.24)_0%,rgba(255,255,255,0.72)_100%)] p-4">
                      <div className="flex h-full min-h-[9rem] flex-col justify-between">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[#7d6434]">
                          Progress visual
                        </span>
                        <div className="space-y-2">
                          <div className="h-2 rounded-full bg-white/70" />
                          <div className="h-2 w-4/5 rounded-full bg-[#cfb27a]" />
                          <div className="h-2 w-3/5 rounded-full bg-white/70" />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <div className="rounded-[1.25rem] border border-black/10 bg-white/75 p-4">
                        <div className="h-12 rounded-[0.9rem] bg-[linear-gradient(135deg,rgba(17,17,19,0.1)_0%,rgba(198,169,107,0.18)_100%)]" />
                      </div>
                      <div className="story-visual-band story-visual-band-soft">
                        <span>Travel</span>
                        <span>Lifestyle</span>
                        <span>Freedom</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-500">
                  Built-in visual composition while the final premium media layer is still being added.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          {storySteps.map((step, stepIndex) => (
            <article
              key={step.title}
              className={`rounded-[1.9rem] border p-6 shadow-panel transition-colors duration-200 md:p-8 ${
                stepIndex < 2
                  ? "border-white/10 bg-background-soft text-text"
                  : "border-black/10 bg-white/78 text-text-dark"
              }`}
            >
              <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-display text-2xl uppercase tracking-[0.08em] text-[#7d6434]">
                  {step.index}
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h3 className="display-title break-words text-3xl [overflow-wrap:anywhere] md:text-5xl">
                      {step.title}
                    </h3>
                    <p
                      className={`text-lg leading-7 ${
                        stepIndex < 2 ? "text-zinc-300" : "text-zinc-700"
                      }`}
                    >
                      {step.subtitle}
                    </p>
                  </div>
                  <p
                    className={`max-w-2xl text-base leading-8 ${
                      stepIndex < 2 ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {step.copy}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
