import type { DisputeRecord, DisputeVersionRecord, EscalationHistoryRecord, EscalationStage } from "@/lib/types";

const STAGE_OPTIONS: EscalationStage[] = [
  "initial_dispute",
  "reinforcement_dispute",
  "formal_escalation_notice",
  "claim_preparation",
  "external_action",
];

export function EscalationPipelinePanel({
  dispute,
  version,
  history,
  returnTo,
}: {
  dispute: DisputeRecord | null;
  version: DisputeVersionRecord | null;
  history: EscalationHistoryRecord[];
  returnTo: string;
}) {
  const strategyOutput = version?.strategyOutput;
  const pipeline = strategyOutput?.pipeline;

  if (!dispute || !version || !strategyOutput || !pipeline) {
    return (
      <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
        <p className="eyebrow">Escalation pipeline</p>
        <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
          Escalation is not available yet.
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-600">
          Generate and score a dispute draft first so the system can assign the correct escalation stage.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-black/10 bg-white/72 p-5">
      <div className="space-y-3">
        <p className="eyebrow">Escalation pipeline</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {pipeline.stage.replaceAll("_", " ")}.
          </h3>
          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-dark">
            {strategyOutput.escalation.tier.replaceAll("_", " ")}
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-700">{pipeline.stageReason}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
          <strong className="text-text-dark">Recommended next stage:</strong>{" "}
          {pipeline.recommendedNextStage?.replaceAll("_", " ") ?? "none"}
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-white/72 px-4 py-4 text-sm leading-7 text-zinc-700">
          <strong className="text-text-dark">Claim preservation:</strong>{" "}
          {strategyOutput.escalation.claimPreservation ? "enabled" : "not required"}
        </div>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
        <strong className="text-text-dark">Escalation letter output:</strong>{" "}
        {pipeline.claimPacket.claimPacketPdfPath ?? "generated in-app"}
        <br />
        <strong className="text-text-dark">Export bundle:</strong>{" "}
        {pipeline.claimPacket.exportBundlePath ?? "generated in-app"}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {pipeline.recommendedNextStage ? (
          <form method="POST" action={`/api/disputes/${dispute.id}/escalation`}>
            <input type="hidden" name="mode" value="advance" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
            >
              Approve Next Escalation Stage
            </button>
          </form>
        ) : null}

        <form method="POST" action={`/api/disputes/${dispute.id}/escalation`} className="flex flex-wrap gap-3">
          <input type="hidden" name="mode" value="override" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <select
            name="targetStage"
            defaultValue={pipeline.stage}
            className="min-h-12 rounded-[0.95rem] border border-black/10 bg-white px-4 text-sm text-text-dark"
          >
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
          >
            Override Stage
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-black/10 bg-white/72 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Escalation history</p>
        <div className="mt-3 grid gap-3">
          {history.length ? (
            history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-800"
              >
                <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                  {entry.toStage.replaceAll("_", " ")}
                </p>
                <p>{entry.reason}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
                  {entry.actorType} {entry.actorId} | {new Date(entry.createdAt).toLocaleString()}
                  {entry.overrideApplied ? " | override" : ""}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700">
              No escalation transitions recorded yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
