import { defectCodeMeta } from "@/lib/defects";
import type { DefectFinding } from "@/lib/types";

export function IssueSummary({ findings }: { findings: DefectFinding[] }) {
  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Detected issues</p>
        <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
          Findings organized for draft generation.
        </h3>
      </div>

      <div className="mt-5 grid gap-3">
        {findings.map((finding) => (
          <div
            key={`${finding.bureau}-${finding.accountName}-${finding.accountLast4}-${finding.defectCode}`}
            className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-dark">
                  {finding.bureau} | {finding.accountName} | {finding.accountLast4}
                </p>
                <p className="text-sm leading-7 text-zinc-600">{finding.reason}</p>
              </div>
              <span className="rounded-full border border-black/10 bg-white/72 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
                {defectCodeMeta[finding.defectCode].label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
