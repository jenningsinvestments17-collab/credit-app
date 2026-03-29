import { notFound } from "next/navigation";
import { AIReviewPanel } from "@/components/admin/AIReviewPanel";
import { ApprovedDisputePanel } from "@/components/admin/ApprovedDisputePanel";
import { BureauReportPanel } from "@/components/admin/BureauReportPanel";
import { ContractStatusPanel } from "@/components/admin/ContractStatusPanel";
import { DisputeDraftPreview } from "@/components/admin/DisputeDraftPreview";
import { DisputeVersionHistoryPanel } from "@/components/admin/DisputeVersionHistoryPanel";
import { EscalationPipelinePanel } from "@/components/admin/EscalationPipelinePanel";
import { IssueSummary } from "@/components/admin/IssueSummary";
import { LeadDocumentsPanel } from "@/components/admin/LeadDocumentsPanel";
import { LeadRow } from "@/components/admin/LeadRow";
import { MailQueuePanel } from "@/components/admin/MailQueuePanel";
import { MailingPaymentStatus } from "@/components/admin/MailingPaymentStatus";
import { SupportBlock } from "@/components/ui/SupportBlock";
import { requireAuthenticatedAdmin } from "@/lib/auth";
import { getAIReadiness } from "@/lib/ai/review";
import { buildFallbackViolationAnalysis } from "@/lib/ai/violationEngine";
import { getDisputeWorkflowByLeadId, getEscalationHistoryForDispute } from "@/lib/disputes/service";
import { disputeWorkflowStatusMeta } from "@/lib/disputes/mailing";
import { getLeadById } from "@/lib/leads";
import { getMailingJobByDisputeId, getPaymentRecordByDisputeId } from "@/lib/mailing/repository";
import { mailingProviderStatusLabels, mailingStatusLabels } from "@/lib/ui/statusLabels";
import type { DisputeDraft } from "@/lib/types";

export default async function AdminLeadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: {
    ai?: string;
    mailing?: string;
    payment?: string;
    pdf?: string;
    escalation?: string;
    service?: string;
  };
}) {
  await requireAuthenticatedAdmin();
  const lead = getLeadById(params.id);

  if (!lead) {
    notFound();
  }

  const readiness = getAIReadiness(lead);
  const disputeState = await getDisputeWorkflowByLeadId(lead.id);
  const payment = disputeState.dispute
    ? await getPaymentRecordByDisputeId(disputeState.dispute.id)
    : null;
  const mailingJob = disputeState.dispute
    ? await getMailingJobByDisputeId(disputeState.dispute.id)
    : null;
  const escalationHistory = disputeState.dispute
    ? await getEscalationHistoryForDispute(disputeState.dispute.id)
    : [];
  const workflowMeta = disputeState.dispute
    ? disputeWorkflowStatusMeta[disputeState.dispute.workflowStatus]
    : null;
  const findings =
    disputeState.currentVersion?.findings ?? [];
  const draftForPreview: DisputeDraft | null =
    (disputeState.currentVersion && disputeState.dispute
      ? {
          bureau: disputeState.dispute.bureau,
          generatedAt: disputeState.currentVersion.createdAt,
          status: disputeState.dispute.processingStatus,
          summary: disputeState.currentVersion.summary,
          letterText: disputeState.currentVersion.letterText,
          findings: disputeState.currentVersion.findings,
          violationAnalysis: buildFallbackViolationAnalysis(),
          strategyOutput: disputeState.currentVersion.strategyOutput,
          modelInputNotes: [],
          reviewedAt: disputeState.dispute.approvedAt,
          approvedAt: disputeState.dispute.approvedAt,
          approvedBy: disputeState.dispute.approvedBy,
          adminReviewNotes: disputeState.currentVersion.notes,
        }
      : lead.disputeDraft ?? null);
  const draftReportSource = draftForPreview
    ? readiness.reportSources.find((source) => source.bureau === draftForPreview.bureau) ?? null
    : null;

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(198,169,107,0.14),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(198,169,107,0.04)_100%)]" />

        <div className="relative section-stack">
          <div className="section-intro">
            <div className="space-y-4">
              <p className="eyebrow">Admin lead detail</p>
              <h1 className="display-title-lg text-text-dark">Review the file.</h1>
            </div>
            <p className="section-copy">
              This is the internal handoff space for document readiness, AI review, draft dispute generation,
              and final mailing control. The workflow now stays gated through persisted backend state instead of placeholder-only query steps.
            </p>
          </div>

          <LeadRow lead={lead} />

          {!readiness.ready ? (
            <SupportBlock
              eyebrow="AI readiness blockers"
              title="What is still missing"
              items={readiness.missingItems}
            />
          ) : (
            <SupportBlock
              eyebrow="AI review source"
              title="What the review used"
              items={readiness.reportSources.map(
                (item) =>
                  `${item.bureau}: ${item.uploaded ? item.normalizedSummary : "Report not available"}`,
              )}
            />
          )}

          {workflowMeta ? (
            <div className="rounded-[1.3rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
              <strong className="text-text-dark">Dispute workflow:</strong> {workflowMeta.label}.{" "}
              {workflowMeta.description}
            </div>
          ) : null}

          {searchParams?.mailing ? (
            <div className="rounded-[1.3rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-800">
              Mailing update: {searchParams.mailing.replaceAll("-", " ")}.
            </div>
          ) : null}
          {searchParams?.ai ? (
            <div className="rounded-[1.3rem] border border-sky-400/20 bg-sky-500/10 px-4 py-4 text-sm leading-7 text-sky-900">
              AI update: {searchParams.ai.replaceAll("-", " ")}.
            </div>
          ) : null}
          {searchParams?.payment ? (
            <div className="rounded-[1.3rem] border border-sky-400/20 bg-sky-500/10 px-4 py-4 text-sm leading-7 text-sky-900">
              Payment update: {searchParams.payment.replaceAll("-", " ")}.
            </div>
          ) : null}
          {searchParams?.pdf ? (
            <div className="rounded-[1.3rem] border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-900">
              PDF update: {searchParams.pdf.replaceAll("-", " ")}.
            </div>
          ) : null}
          {searchParams?.escalation ? (
            <div className="rounded-[1.3rem] border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-4 text-sm leading-7 text-fuchsia-900">
              Escalation update: {searchParams.escalation.replaceAll("-", " ").replaceAll("_", " ")}.
            </div>
          ) : null}
          {searchParams?.service ? (
            <div className="rounded-[1.3rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-900">
              Service update: {searchParams.service.replaceAll("-", " ")}.
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="grid gap-5">
              <LeadDocumentsPanel lead={lead} />
              <ContractStatusPanel lead={lead} />
              <MailQueuePanel lead={lead} mode="lead" />
              <AIReviewPanel
                lead={lead}
                disputeId={disputeState.dispute?.id}
                processingStatus={disputeState.dispute?.processingStatus}
              />
              <ApprovedDisputePanel
                dispute={disputeState.dispute}
                version={disputeState.currentVersion}
                payment={payment}
                mailingJob={mailingJob}
                returnTo={`/admin/leads/${lead.id}`}
              />
              <EscalationPipelinePanel
                dispute={disputeState.dispute}
                version={disputeState.currentVersion}
                history={escalationHistory}
                returnTo={`/admin/leads/${lead.id}`}
              />
              {disputeState.dispute ? (
                <MailingPaymentStatus
                  payment={payment}
                  disputeId={disputeState.dispute.id}
                  returnTo={`/admin/leads/${lead.id}`}
                />
              ) : null}
            </section>

            <section className="grid gap-5">
              {draftForPreview ? (
                <>
                  <IssueSummary findings={findings} />
                  <DisputeVersionHistoryPanel versions={disputeState.versions} />
                  <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <BureauReportPanel bureau={draftForPreview.bureau} source={draftReportSource} />
                    <DisputeDraftPreview draft={draftForPreview} />
                  </div>
                </>
              ) : (
                <SupportBlock
                  eyebrow="Draft output"
                  title="No draft generated yet"
                  items={[
                    "AI review must stay gated behind all required uploads and bureau report readiness.",
                    "Generated letters remain drafts for admin review only.",
                    "No auto-send, complaint filing, or certified mail queueing happens in this workflow.",
                  ]}
                />
              )}

              {mailingJob ? (
                <SupportBlock
                  eyebrow="Mailing packet"
                  title={`${mailingJob.bureau} mailing job in progress.`}
                  items={[
                    `Workflow status: ${mailingStatusLabels[mailingJob.workflowStatus]}`,
                    `Provider status: ${mailingProviderStatusLabels[mailingJob.providerStatus]}`,
                    `Tracking: ${mailingJob.trackingNumber ?? "pending"}`,
                    `Delivery status: ${mailingJob.deliveryStatus.replaceAll("_", " ")}`,
                    `Signed return receipt: ${mailingJob.signedReturnReceiptStatus?.replaceAll("_", " ") ?? "pending"}`,
                    `Receipt signer: ${mailingJob.signedReturnReceiptSigner ?? "not yet returned"}`,
                    `Receipt file: ${mailingJob.signedReturnReceiptPath ?? "not yet stored"}`,
                  ]}
                />
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
