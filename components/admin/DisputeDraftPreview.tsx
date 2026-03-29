import type { DisputeDraft } from "@/lib/types";

export function DisputeDraftPreview({ draft }: { draft: DisputeDraft }) {
  return (
    <section className="rounded-[1.5rem] border border-zinc-400 bg-zinc-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="space-y-3">
        <p className="eyebrow">Draft dispute letter</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {draft.bureau} draft preview.
          </h3>
          <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-800">
            {draft.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="text-sm leading-7 text-zinc-900">{draft.summary}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-zinc-400 bg-zinc-50 px-4 py-4 text-sm leading-7 text-zinc-950">
          Reviewed: {draft.reviewedAt ? new Date(draft.reviewedAt).toLocaleString() : "not yet"}
        </div>
        <div className="rounded-[1.2rem] border border-zinc-400 bg-zinc-50 px-4 py-4 text-sm leading-7 text-zinc-950">
          Approved:{" "}
          {draft.approvedAt
            ? `${new Date(draft.approvedAt).toLocaleString()} by ${draft.approvedBy ?? "admin"}`
            : "not yet"}
        </div>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-zinc-400 bg-zinc-50 p-6">
        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-8 text-zinc-950">
          {draft.letterText}
        </pre>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-zinc-400 bg-zinc-100 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Dispute codes used</p>
        <div className="mt-3 grid gap-3">
          {draft.findings.map((finding) => (
            <div
              key={`${finding.bureau}-${finding.accountName}-${finding.accountLast4}`}
              className="rounded-2xl border border-zinc-400 bg-zinc-100 px-4 py-3 text-sm leading-7 text-zinc-950"
            >
              <strong className="text-text-dark">{finding.accountName}</strong>
              <div className="mt-2 flex flex-wrap gap-2">
                {(finding.disputeCodes ?? []).map((code) => (
                  <span
                    key={code}
                    className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-zinc-400 bg-zinc-100 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Violation summary</p>
        <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-950">
          <div className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3">
            <strong className="text-text-dark">Overall strength:</strong>{" "}
            {draft.violationAnalysis.overallStrength}
          </div>
          <div className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3">
            <strong className="text-text-dark">Strategy:</strong>{" "}
            {draft.violationAnalysis.strategy.replaceAll("_", " ")}
          </div>
          <div className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3">
            {draft.violationAnalysis.violationSummary}
          </div>
          {draft.violationAnalysis.violations.length ? (
            <div className="grid gap-3">
              {draft.violationAnalysis.violations.map((violation) => (
                <div
                  key={`${violation.type}-${violation.accountKey}-${violation.bureau ?? "na"}`}
                  className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3"
                >
                  <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                    {violation.type.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-zinc-950">
                    {violation.explanation}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-700">
                    {violation.law} | score {violation.score} | confidence{" "}
                    {Math.round(violation.confidence * 100)}%
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {draft.strategyOutput ? (
        <div className="mt-5 rounded-[1.2rem] border border-zinc-400 bg-zinc-100 p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Case scoring and escalation</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-950">
              <strong className="text-text-dark">Case score:</strong> {draft.strategyOutput.caseScore.totalScore}
            </div>
            <div className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-950">
              <strong className="text-text-dark">Strength:</strong>{" "}
              {draft.strategyOutput.caseScore.classification}
            </div>
            <div className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-950">
              <strong className="text-text-dark">Escalation tier:</strong>{" "}
              {draft.strategyOutput.escalation.tier.replaceAll("_", " ")}
            </div>
            <div className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-950">
              <strong className="text-text-dark">Tone:</strong> {draft.strategyOutput.escalation.tone.replaceAll("_", " ")}
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-950">
            <strong className="text-text-dark">Recommendation:</strong>{" "}
            {draft.strategyOutput.escalation.escalationRecommendation}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950">
              Statutes: {draft.strategyOutput.escalation.includeStatutes ? "include" : "limited"}
            </span>
            <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950">
              Claim preservation: {draft.strategyOutput.escalation.claimPreservation ? "on" : "off"}
            </span>
          </div>
          {draft.strategyOutput.escalation.flags.length ? (
            <div className="mt-3 grid gap-3">
              {draft.strategyOutput.escalation.flags.map((flag) => (
                <div
                  key={flag.type}
                  className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-950"
                >
                  <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                    {flag.title}
                  </p>
                  <p className="mt-2">{flag.reason}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-700">
                    {flag.type.replaceAll("_", " ")} | weight {flag.weight}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-[1.2rem] border border-zinc-400 bg-zinc-100 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Recommended next steps</p>
        <div className="mt-3 grid gap-3">
          {draft.violationAnalysis.recommendedNextSteps.map((step) => (
            <div key={step} className="rounded-2xl border border-zinc-400 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-950">
              {step}
            </div>
          ))}
        </div>
      </div>

      {draft.adminReviewNotes?.length ? (
        <div className="mt-5 rounded-[1.2rem] border border-zinc-400 bg-zinc-100 p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Admin review notes</p>
          <div className="mt-3 grid gap-3">
            {draft.adminReviewNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-zinc-400 bg-zinc-100 px-4 py-3 text-sm leading-7 text-zinc-950">
                {note}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950">
          Review draft
        </span>
        <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950">
          Copy draft
        </span>
        <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950">
          Edit draft
        </span>
        <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950">
          Save draft
        </span>
        <span className="rounded-full border border-zinc-400 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-950">
          Mark ready for final review
        </span>
      </div>
    </section>
  );
}
