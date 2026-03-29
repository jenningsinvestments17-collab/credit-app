import { LeadRow } from "@/components/admin/LeadRow";
import type { AdminQueueSectionModel } from "@/lib/services/adminCommandCenter";
import type { BureauReportRecord } from "@/lib/types";

export function AdminQueueSection({
  section,
  parsedReportMap,
}: {
  section: AdminQueueSectionModel;
  parsedReportMap: Record<string, BureauReportRecord[]>;
}) {
  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="eyebrow">{section.title}</p>
            <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
              {section.leads.length} file{section.leads.length === 1 ? "" : "s"}
            </h3>
          </div>
          <span className="rounded-full border border-black/10 bg-surface-light-soft px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
            queue view
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-600">{section.helper}</p>
      </div>

      <div className="mt-5 grid gap-4">
        {section.leads.length ? (
          section.leads.map((lead) => (
            <LeadRow
              key={`${section.id}-${lead.id}`}
              lead={lead}
              compact
              parsedReports={parsedReportMap[lead.id] ?? []}
            />
          ))
        ) : (
          <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-600">
            Nothing is sitting in this queue right now.
          </div>
        )}
      </div>
    </section>
  );
}
