import { completeReviewStepAction } from "@/lib/services/intakeService";
import type { IntakeViewModel } from "@/types/intake";

export function ReviewStep({ model }: { model: IntakeViewModel }) {
  const action = completeReviewStepAction.bind(null, model.userId, model.lead);

  return (
    <form action={action} className="rounded-[1.7rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
      <p className="eyebrow">Review</p>
      <h2 className="mt-3 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
        Final intake check.
      </h2>
      <div className="mt-6 grid gap-4">
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          Documents ready: {model.documentsReady ? "yes" : "no"}.
        </div>
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          Disclosures complete: {model.disclosuresAccepted ? "yes" : "no"}.
        </div>
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          Contracts acknowledged: {model.contractsAccepted ? "yes" : "no"}.
        </div>
        <label className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
          <input type="checkbox" name="reviewConfirmed" className="mr-3" />
          I confirm this intake is complete and ready to return to the dashboard.
        </label>
      </div>
      <button type="submit" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/60 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft">
        Complete Intake
      </button>
    </form>
  );
}
