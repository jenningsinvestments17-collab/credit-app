import { CertifiedMailQueueTable } from "@/components/admin/CertifiedMailQueueTable";
import { SupportBlock } from "@/components/ui/SupportBlock";
import { requireAuthenticatedAdmin } from "@/lib/auth";
import { listDisputes } from "@/lib/disputes/repository";
import { getAllLeads } from "@/lib/leads";
import { listMailingJobs, getPaymentRecordByDisputeId } from "@/lib/mailing/repository";

export default async function AdminMailQueuePage() {
  await requireAuthenticatedAdmin();
  const leads = getAllLeads();
  const disputes = await listDisputes();
  const mailingJobs = await listMailingJobs();
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));

  const rows = disputes.reduce<
    Array<{ dispute: (typeof disputes)[number]; mailingJob: (typeof mailingJobs)[number]; lead?: (typeof leads)[number] }>
  >((acc, dispute) => {
    const mailingJob = mailingJobs.find((job) => job.disputeId === dispute.id);
    if (!mailingJob) {
      return acc;
    }

    acc.push({
      dispute,
      mailingJob,
      lead: leadsById.get(dispute.leadId),
    });
    return acc;
  }, []);

  const paymentEntries = await Promise.all(
    disputes.map(async (dispute) => [dispute.id, await getPaymentRecordByDisputeId(dispute.id)] as const),
  );
  const paymentsByDisputeId = new Map(
    paymentEntries.filter((entry): entry is readonly [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[1])),
  );

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(198,169,107,0.14),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(198,169,107,0.04)_100%)]" />

        <div className="relative section-stack">
          <div className="section-intro">
            <div className="space-y-4">
              <p className="eyebrow">Admin mail queue</p>
              <h1 className="display-title-lg text-text-dark">Certified mail control.</h1>
            </div>
            <p className="section-copy">
              Final dispute letters only enter this queue after admin review, final version generation,
              and payment confirmation. The mailing pipeline stays separate from email notifications and
              remains deliberate, traceable, and future-ready.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <SupportBlock
              eyebrow="Queue rules"
              title="Approved first. Paid second. Sent third."
              items={[
                "A dispute must be approved before a final mailing PDF is created.",
                "Payment must be confirmed before a certified mail job can be sent to the provider.",
                "Tracking, proof of mailing, and delivery states stay attached to the mailing job record.",
              ]}
            />

            <CertifiedMailQueueTable
              rows={rows}
              leadsById={leadsById}
              paymentsByDisputeId={paymentsByDisputeId}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
