import Link from "next/link";
import type { AdminDashboardViewModel } from "@/types/adminDashboard";

export function PipelineBoard({ model }: { model: AdminDashboardViewModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#121215]/92 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
      <div className="space-y-3">
        <p className="eyebrow">Pipeline board</p>
        <h3 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Workflow lanes.
        </h3>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="grid min-w-[1100px] grid-cols-8 gap-4">
          {model.pipeline.map((section) => (
            <div key={section.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold uppercase tracking-[0.08em] text-white">{section.title}</p>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  {section.cards.length}
                </span>
              </div>
              <p className="mt-2 text-xs leading-6 text-zinc-500">{section.helper}</p>

              <div className="mt-4 grid gap-3">
                {section.cards.length ? (
                  section.cards.slice(0, 8).map((card) => (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="rounded-[1rem] border border-white/10 bg-[#0f0f11] px-3 py-3 text-sm leading-6 text-zinc-200 transition-all duration-200 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_10px_30px_rgba(198,169,107,0.1)]"
                    >
                      <p className="font-semibold uppercase tracking-[0.08em] text-white">{card.fullName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {card.statusLabel}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-white/10 px-3 py-5 text-sm leading-7 text-zinc-500">
                    No cards here.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
