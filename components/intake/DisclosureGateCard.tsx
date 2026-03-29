import type { IntakeExperienceModel } from "@/lib/services/intakeExperience";

export function DisclosureGateCard({
  disclosures,
}: {
  disclosures: IntakeExperienceModel["disclosures"];
}) {
  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="space-y-3">
        <p className="eyebrow">Required disclosures</p>
        <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          No skipping the required gates.
        </h3>
        <p className="text-sm leading-7 text-zinc-400">
          Intake, uploads, disclosures, and signatures stay in order so the file is review-ready before AI ever starts.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {disclosures.map((item) => (
          <div
            key={item.id}
            className={`rounded-[1.1rem] border px-4 py-4 text-sm leading-7 ${
              item.status === "ready"
                ? "border-emerald-400/20 bg-emerald-500/10 text-zinc-100"
                : "border-white/10 bg-black/20 text-zinc-300"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.22em]">
              {item.status === "ready" ? "Available in workflow" : "Pending stage"}
            </p>
            <p className="mt-2 font-semibold uppercase tracking-[0.06em]">{item.label}</p>
            <p className="mt-2">{item.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
