import { CalendlyEmbed } from "@/components/book/CalendlyEmbed";
import { Button } from "@/components/ui/Button";
import { SupportBlock } from "@/components/ui/SupportBlock";
import { getBookingTriggerPreview } from "@/lib/mail/triggers";
import { createLeadDraftFromBooking } from "@/lib/leads";

const consultHighlights = [
  "Review where credit pressure is showing up right now",
  "Map the cleanest next move before you start the process",
  "Clarify what to upload, prepare, and expect after the call",
];

const prepareNotes = [
  "Bring your main credit questions and the goal you want better credit to support.",
  "If you already have reports, bring them. If not, we will still outline what to gather next.",
  "After booking, the next step is a cleaner intake and a more visible client workflow.",
];

export default function BookPage() {
  const bookingHandoff = createLeadDraftFromBooking();
  const bookingNotifications = getBookingTriggerPreview();

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.16),transparent_22%),radial-gradient(circle_at_86%_20%,rgba(255,255,255,0.8),transparent_16%)]" />

        <div className="relative section-stack">
          <div className="section-intro">
            <div className="space-y-4">
              <p className="eyebrow">Book consultation</p>
              <h1 className="display-title-lg text-text-dark">
                Start with a clear conversation.
              </h1>
            </div>
            <p className="section-copy">
              This consultation is built to make the next step easier to understand.
              We use it to frame the credit issue, explain the process, and help you
              move into intake with more confidence and less guesswork.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="grid gap-5">
              <SupportBlock
                eyebrow="What this is for"
                title="Book the conversation. Clarify the path."
                items={consultHighlights}
              />

              <section className="panel-light">
                <div className="space-y-4">
                  <p className="eyebrow">What happens after booking</p>
                  <h2 className="display-title text-3xl text-text-dark md:text-5xl">
                    The consultation leads into a cleaner intake.
                  </h2>
                  <p className="text-base leading-8 text-zinc-600">
                    Once the call is booked, the next move is straightforward. You
                    will know what to prepare, what the workflow will require, and how
                    the credit reports fit into the full process.
                  </p>
                  <div className="rounded-2xl border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-700">
                    Internal handoff placeholder: booking prepares the lead record with the
                    next status set to <strong>{bookingHandoff.nextStatus}</strong> so intake can
                    continue the same pipeline instead of starting a separate track.
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white/78 px-4 py-4 text-sm leading-7 text-zinc-700">
                    <strong className="text-text-dark">Notification queue:</strong>{" "}
                    {bookingNotifications.map((item) => item.label).join(", ")}.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button href="/intake">Go To Intake</Button>
                    <Button href="/" variant="secondaryLight">
                      Back To Homepage
                    </Button>
                  </div>
                </div>
              </section>
            </section>

            <section className="panel-dark-soft">
              <div className="space-y-5">
                <CalendlyEmbed />
                <SupportBlock
                  eyebrow="Before the call"
                  title="Simple preparation. Better clarity."
                  items={prepareNotes}
                  tone="dark"
                />
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
