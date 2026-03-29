import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="final-cta-shell soft-divider relative overflow-hidden rounded-[2.25rem] border border-black/5 bg-[linear-gradient(180deg,rgba(245,245,244,0.96)_0%,rgba(255,255,255,0.88)_100%)] p-6 shadow-panel md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.18),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.9),transparent_18%),linear-gradient(180deg,transparent_0%,rgba(198,169,107,0.06)_100%)]" />

      <div className="relative flex flex-col items-center gap-8 text-center">
        <div className="max-w-4xl space-y-4">
          <p className="eyebrow">Your next move starts here</p>
          <h2 className="display-title-lg break-words text-text-dark [overflow-wrap:anywhere]">
            Better credit. Clearer process. No upfront fee.
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-8 text-zinc-600 md:text-lg">
            Better credit opens better options. The process stays guided from intake to upload to review to mailing, and the service fee only comes due after the work is rendered.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Button href="/intake">Start Your Credit Review</Button>
          <Button href="/book" variant="secondary">
            Book Consultation
          </Button>
        </div>

        <p className="max-w-2xl text-sm leading-7 text-zinc-500">
          Clear process. Cleaner options. Stronger trust. Built to feel premium without turning the client journey into clutter.
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Returning client?{" "}
          <Link href="/login" className="text-[#7d6434] hover:text-accent">
            Access your portal
          </Link>
        </p>
      </div>
    </section>
  );
}
