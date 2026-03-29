import { leadStatusMeta } from "@/lib/leads";
import type { LeadStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = leadStatusMeta[status];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}
