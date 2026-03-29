import { ContractStatusCard } from "@/components/contracts/ContractStatusCard";
import { saveContractsStepAction } from "@/lib/services/intakeService";
import type { IntakeViewModel } from "@/types/intake";

export function ContractsStep({ model }: { model: IntakeViewModel }) {
  const action = saveContractsStepAction.bind(null, model.userId);

  return (
    <div className="grid gap-6">
      <ContractStatusCard status={model.lead.contractPacketStatus} documents={model.contractDocuments} />
      <form action={action} className="rounded-[1.7rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
        <p className="eyebrow">Contracts gate</p>
        <h2 className="mt-3 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Acknowledge the onboarding packet.
        </h2>
        <div className="mt-6 grid gap-4">
          <label className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
            <input type="checkbox" name="contractAcknowledged" className="mr-3" defaultChecked={model.contractsAccepted} />
            I understand the onboarding packet and contract flow are part of the required intake sequence.
          </label>
          <label className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300">
            <input type="checkbox" name="authorizationAcknowledged" className="mr-3" defaultChecked={model.contractsAccepted} />
            I understand document upload and review stay locked to the required onboarding authorizations.
          </label>
        </div>
        <button type="submit" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/60 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft">
          Continue To Documents
        </button>
      </form>
    </div>
  );
}
