import { certifiedMailQueueStatusMeta } from "@/lib/disputes/mailing";
import type { CertifiedMailQueueStatus } from "@/lib/types";

export function MailQueueStatusBadge({ status }: { status: CertifiedMailQueueStatus }) {
  const meta = certifiedMailQueueStatusMeta[status];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.tone}`}>
      {meta.label}
    </span>
  );
}
