import type { ClientDashboardViewModel } from "@/types/dashboard";

function getStatusStyles(status: "complete" | "current" | "upcoming") {
  if (status === "complete") {
    return {
      dot: "bg-emerald-500",
      shell: "border-emerald-400/20 bg-emerald-500/10",
      text: "text-emerald-100",
      detail: "text-emerald-50/90",
    };
  }
  if (status === "current") {
    return {
      dot: "bg-accent",
      shell: "border-accent/25 bg-accent/10",
      text: "text-[#f2e0b5]",
      detail: "text-zinc-200",
    };
  }
  return {
    dot: "bg-zinc-500",
    shell: "border-white/10 bg-white/[0.04]",
    text: "text-zinc-200",
    detail: "text-zinc-400",
  };
}

export function DisputeTimeline({ model }: { model: ClientDashboardViewModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Dispute timeline</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white md:text-5xl">
          From reviewed file to mailed dispute.
        </h2>
        <p className="text-base leading-8 text-zinc-300">
          This shows how your case moves from uploads into AI, admin review, payment release, and certified mail.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {model.disputeTimeline.map((item) => {
          const styles = getStatusStyles(item.status);
          return (
            <article key={item.id} className={`rounded-[1.25rem] border p-4 ${styles.shell}`}>
              <div className="flex items-start gap-4">
                <span className={`mt-2 inline-flex h-3 w-3 shrink-0 rounded-full ${styles.dot}`} />
                <div className="space-y-2">
                  <h3 className={`font-display text-2xl uppercase leading-[0.94] tracking-[0.03em] ${styles.text}`}>
                    {item.label}
                  </h3>
                  <p className={`text-sm leading-7 ${styles.detail}`}>{item.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
