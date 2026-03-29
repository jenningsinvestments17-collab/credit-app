import type { ClientDashboardModel } from "@/lib/services/clientDashboard";

function getStatusStyles(status: "complete" | "current" | "upcoming") {
  if (status === "complete") {
    return {
      dot: "bg-emerald-500",
      shell: "border-emerald-400/20 bg-emerald-500/10",
      text: "text-emerald-800",
    };
  }
  if (status === "current") {
    return {
      dot: "bg-accent",
      shell: "border-amber-400/20 bg-amber-500/10",
      text: "text-amber-900",
    };
  }
  return {
    dot: "bg-zinc-300",
    shell: "border-black/10 bg-surface-light-soft",
    text: "text-zinc-700",
  };
}

export function DisputeTimelineCard({
  timeline,
}: {
  timeline: ClientDashboardModel["disputeTimeline"];
}) {
  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/72 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Dispute timeline</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark md:text-5xl">
          From reviewed file to mailed dispute.
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          This shows how your case moves from uploads into AI, admin review, payment release, and certified mail.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {timeline.map((item) => {
          const styles = getStatusStyles(item.status);
          return (
            <article key={item.id} className={`rounded-[1.25rem] border p-4 ${styles.shell}`}>
              <div className="flex items-start gap-4">
                <span className={`mt-2 inline-flex h-3 w-3 shrink-0 rounded-full ${styles.dot}`} />
                <div className="space-y-2">
                  <h3 className={`font-display text-2xl uppercase leading-[0.94] tracking-[0.03em] ${styles.text}`}>
                    {item.label}
                  </h3>
                  <p className="text-sm leading-7 text-zinc-700">{item.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
