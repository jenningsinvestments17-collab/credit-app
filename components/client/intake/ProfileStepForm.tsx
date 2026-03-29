import { saveProfileStepAction } from "@/lib/services/intakeService";
import type { IntakeViewModel } from "@/types/intake";

export function ProfileStepForm({ model }: { model: IntakeViewModel }) {
  const action = saveProfileStepAction.bind(null, model.userId);

  return (
    <form action={action} className="rounded-[1.7rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
      <div className="space-y-3">
        <p className="eyebrow">Profile</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Start the file clean.
        </h2>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input name="firstName" defaultValue={model.profile.firstName} placeholder="First name" className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
        <input name="lastName" defaultValue={model.profile.lastName} placeholder="Last name" className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
        <input name="phone" defaultValue={model.profile.phone} placeholder="Phone" className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
        <input name="city" defaultValue={model.profile.city} placeholder="City" className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
        <input name="state" defaultValue={model.profile.state} placeholder="State" className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 md:col-span-2" />
        <textarea name="primaryGoal" defaultValue={model.profile.primaryGoal} placeholder="What is the main credit issue you want fixed first?" className="min-h-[8rem] rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 md:col-span-2" />
      </div>

      <button type="submit" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/60 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft">
        Save And Continue
      </button>
    </form>
  );
}
