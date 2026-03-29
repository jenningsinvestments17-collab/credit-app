import { Button } from "@/components/ui/Button";
import type { ClientDashboardModel } from "@/lib/services/clientDashboard";

function getToneStyles(tone: "urgent" | "active" | "complete") {
  if (tone === "complete") {
    return "border-emerald-400/20 bg-emerald-500/10";
  }
  if (tone === "active") {
    return "border-amber-400/20 bg-amber-500/10";
  }
  return "border-rose-400/20 bg-rose-500/10";
}

export function RequiredActionsCard({
  actions,
}: {
  actions: ClientDashboardModel["requiredActions"];
}) {
  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/72 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Required actions</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark md:text-5xl">
          What needs your attention now.
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          The portal keeps only the live actions here so returning clients can tell what is urgent fast.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {actions.map((action) => (
          <article
            key={action.id}
            className={`rounded-[1.3rem] border p-4 ${getToneStyles(action.tone)}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h3 className="font-display text-2xl uppercase leading-[0.94] tracking-[0.03em] text-text-dark">
                  {action.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-700">{action.description}</p>
              </div>
              <div className="shrink-0">
                <Button href={action.href} variant="secondaryLight">
                  {action.ctaLabel}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
