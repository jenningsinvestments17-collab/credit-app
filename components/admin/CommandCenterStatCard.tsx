import type { AdminCommandStat } from "@/lib/services/adminCommandCenter";

export function CommandCenterStatCard({ stat }: { stat: AdminCommandStat }) {
  return (
    <article className="rounded-[1.5rem] border border-black/10 bg-white/78 p-5 shadow-panel">
      <div className="space-y-2">
        <p className="eyebrow">{stat.label}</p>
        <h3 className="font-display text-5xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
          {stat.count}
        </h3>
        <p className="text-sm leading-7 text-zinc-600">{stat.helper}</p>
      </div>
    </article>
  );
}
