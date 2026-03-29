import { ContractList } from "@/components/contracts/ContractList";
import { ContractStatusCard } from "@/components/contracts/ContractStatusCard";
import { ReviewAndSignPanel } from "@/components/contracts/ReviewAndSignPanel";
import { SupportBlock } from "@/components/ui/SupportBlock";
import { requireAuthenticatedClientLead } from "@/lib/auth";
import { requireContractsStage } from "@/lib/services/workflowAccess";

export default async function DashboardContractsPage({
  searchParams,
}: {
  searchParams?: { document?: string };
}) {
  const lead = await requireAuthenticatedClientLead();
  requireContractsStage(lead);
  const activeDocument =
    lead.contractDocuments.find((doc) => doc.key === searchParams?.document) ??
    lead.contractDocuments.find((doc) => doc.status !== "signed") ??
    null;

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.14),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(198,169,107,0.04)_100%)]" />

        <div className="relative section-stack">
          <div className="section-intro">
            <div className="space-y-4">
              <p className="eyebrow">Contracts</p>
              <h1 className="display-title-lg text-text-dark">
                Review your onboarding packet.
              </h1>
            </div>
            <p className="section-copy">
              These documents are part of onboarding and need your review before the process
              can move forward. Signed versus unsigned state is kept visible so you always know what is next.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="grid gap-5">
              <ContractStatusCard
                status={lead.contractPacketStatus}
                documents={lead.contractDocuments}
              />
              <ContractList
                documents={lead.contractDocuments}
                activeDocumentKey={activeDocument?.key}
              />
            </section>

            <section className="grid gap-5">
              <ReviewAndSignPanel lead={lead} document={activeDocument} />
              <SupportBlock
                eyebrow="What happens next"
                title="Signing moves onboarding forward."
                items={[
                  "Review each required document before signing.",
                  "Completed signatures will later update your onboarding status automatically.",
                  "After the packet is fully signed, the portal can move you into the next stage without confusion.",
                ]}
              />
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
