import { Button } from "@/components/ui/Button";
import type { ClientProgress } from "@/lib/types";

export function NextStepCard({ progress }: { progress: ClientProgress }) {
  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/72 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Next action</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
          {progress.nextActionLabel}
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          Returning clients should never have to guess where to go next. The portal
          sends you back to the last meaningful step so the process stays organized.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button href={progress.nextStepRoute}>Continue Where You Left Off</Button>
        <Button href="/book" variant="secondaryLight">
          Book Consultation
        </Button>
      </div>
    </section>
  );
}
