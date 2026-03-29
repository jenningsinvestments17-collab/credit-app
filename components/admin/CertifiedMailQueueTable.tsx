import Link from "next/link";
import { MailQueueStatusBadge } from "@/components/admin/MailQueueStatusBadge";
import type { DisputeRecord, Lead, MailingJobRecord, PaymentRecord } from "@/lib/types";

function statusToBadge(status: MailingJobRecord["providerStatus"]) {
  switch (status) {
    case "queued":
      return "queued" as const;
    case "submitted":
    case "accepted":
    case "tracking_received":
      return "processed" as const;
    case "delivered":
      return "mailed" as const;
    case "failed":
      return "failed" as const;
    default:
      return "pending" as const;
  }
}

export function CertifiedMailQueueTable({
  rows,
  leadsById,
  paymentsByDisputeId,
}: {
  rows: Array<{ dispute: DisputeRecord; mailingJob: MailingJobRecord; lead?: Lead | undefined }>;
  leadsById: Map<string, Lead>;
  paymentsByDisputeId: Map<string, PaymentRecord>;
}) {
  const summary = {
    total: rows.length,
    mailed: rows.filter((row) =>
      ["accepted", "tracking_received", "delivered"].includes(row.mailingJob.providerStatus),
    ).length,
  };

  return (
    <section className="panel-light">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="eyebrow">Certified mail queue</p>
            <h2 className="display-title text-3xl text-text-dark md:text-5xl">
              Approved disputes ready for mailing control.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-black/10 bg-surface-light-soft px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
              {summary.total} packets
            </span>
            <span className="rounded-full border border-black/10 bg-surface-light-soft px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
              {summary.mailed} provider-submitted
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          {rows.map(({ dispute, mailingJob, lead }) => {
            const resolvedLead = lead ?? leadsById.get(mailingJob.leadId);
            const payment = paymentsByDisputeId.get(dispute.id);

            return (
              <div
                key={mailingJob.id}
                className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-dark">
                      {resolvedLead?.fullName ?? mailingJob.leadId}
                    </p>
                    <p className="text-sm leading-7 text-zinc-600">
                      {mailingJob.bureau} | workflow {dispute.workflowStatus.replaceAll("_", " ")}
                    </p>
                    <p className="text-sm leading-7 text-zinc-500">
                      Payment {payment?.status.replaceAll("_", " ") ?? "not created"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <MailQueueStatusBadge status={statusToBadge(mailingJob.providerStatus)} />
                    <span className="rounded-full border border-black/10 bg-surface-light-soft px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
                      {mailingJob.workflowStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm leading-7 text-zinc-700 sm:grid-cols-2 xl:grid-cols-4">
                  <div>Queued: {mailingJob.queuedAt ? new Date(mailingJob.queuedAt).toLocaleDateString() : "not queued"}</div>
                  <div>Provider: {mailingJob.providerStatus.replaceAll("_", " ")}</div>
                  <div>Tracking: {mailingJob.trackingNumber ?? "pending"}</div>
                  <div>Delivery: {mailingJob.deliveryStatus.replaceAll("_", " ")}</div>
                  <div>
                    Return receipt: {mailingJob.signedReturnReceiptStatus?.replaceAll("_", " ") ?? "pending"}
                  </div>
                  <div>
                    Receipt signer: {mailingJob.signedReturnReceiptSigner ?? "not yet returned"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {resolvedLead ? (
                    <Link
                      href={`/admin/leads/${resolvedLead.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-[0.9rem] border border-black/10 bg-white px-4 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
                    >
                      View Lead Detail
                    </Link>
                  ) : null}

                  <a
                    href={`/api/disputes/${dispute.id}/pdf`}
                    className="inline-flex min-h-11 items-center justify-center rounded-[0.9rem] border border-black/10 bg-white px-4 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
                  >
                    View Final PDF
                  </a>
                  {mailingJob.signedReturnReceiptPath ? (
                    <a
                      href={mailingJob.signedReturnReceiptPath}
                      className="inline-flex min-h-11 items-center justify-center rounded-[0.9rem] border border-black/10 bg-white px-4 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
                    >
                      View Signed Return Receipt
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
