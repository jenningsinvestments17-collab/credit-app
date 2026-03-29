import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const desktopVideoSources = [
    { src: "/video/hero-desktop.mp4", type: "video/mp4" },
    { src: "/video/hero-desktop.webm", type: "video/webm" },
  ];

  const mobileVideoSources = [
    { src: "/video/hero-mobile.mp4", type: "video/mp4" },
    { src: "/video/hero-mobile.webm", type: "video/webm" },
  ];

  return (
    <section className="relative flex min-h-[calc(100vh-5.5rem)] items-center overflow-hidden rounded-[2.25rem] border border-white/7 bg-hero-radial px-6 py-10 text-white shadow-panel md:px-12 md:py-14">
      <div className="absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/video/hero-poster.jpg"
          aria-hidden="true"
        >
          {desktopVideoSources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>

        <video
          className="absolute inset-0 h-full w-full object-cover md:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/video/hero-poster-mobile.jpg"
          aria-hidden="true"
        >
          {mobileVideoSources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,12,0.72)_0%,rgba(11,11,12,0.5)_36%,rgba(17,17,19,0.24)_62%,rgba(245,245,244,0.08)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_30%,rgba(255,255,255,0.13),transparent_20%),radial-gradient(circle_at_22%_82%,rgba(198,169,107,0.2),transparent_24%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#111113]/38 to-transparent" />

      <div className="relative grid w-full gap-10 md:grid-cols-[1.08fr_0.92fr] md:items-end">
        <div className="flex max-w-3xl flex-col items-start justify-center gap-5 max-md:items-center max-md:text-center">
          <p className="eyebrow">Credu Consulting</p>
          <div className="inline-flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/40 bg-accent/12 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-accent">
              No upfront service fee
            </span>
            <span className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
              Pay after service is rendered
            </span>
          </div>
          <h1 className="display-title text-6xl md:text-[7.6rem]">
            No Upfront Fee.
            <br />
            Bigger Moves.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-300 md:text-[1.15rem]">
            Start intake. Upload the file. Move through review.
            <br className="hidden md:block" />
            Pay only after the dispute work is rendered and ready for final release.
          </p>
          <div className="flex flex-wrap gap-4 max-md:justify-center">
            <Button href="/intake">Start Intake</Button>
            <Button href="/book" variant="secondary">
              Book A Call
            </Button>
          </div>
          <p className="max-w-xl text-sm leading-7 text-zinc-400">
            Clear intake. Secure uploads. Admin-reviewed disputes. Certified-mail movement. One connected path from the first step to the final release.
          </p>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-zinc-400 max-md:justify-center">
            <span>Client portal</span>
            <span>3-bureau workflow</span>
            <span>AI + admin review</span>
            <span>Tracked mailing</span>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Returning client?{" "}
            <Link href="/login" className="text-accent hover:text-accent-soft">
              Sign in to continue
            </Link>
          </p>
        </div>

        <div className="flex items-end justify-end max-md:justify-center">
          <div className="relative w-full max-w-[31rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(198,169,107,0.24),transparent_22%),radial-gradient(circle_at_78%_26%,rgba(255,255,255,0.14),transparent_18%),linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_38%,rgba(0,0,0,0.08)_100%)]" />
            <div className="absolute -right-10 top-10 h-36 w-36 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute left-8 top-24 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative space-y-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                  No upfront fee offer
                </p>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                  portal workflow
                </span>
              </div>

              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/20">
                  <div className="h-40 bg-[linear-gradient(135deg,rgba(198,169,107,0.34)_0%,rgba(198,169,107,0.06)_28%,rgba(255,255,255,0.1)_60%,rgba(0,0,0,0.12)_100%)] p-5">
                    <div className="flex h-full flex-col justify-between">
                      <div className="story-visual-band">
                        <span>Ownership</span>
                        <span>Approval</span>
                      </div>
                      <div>
                        <p className="font-display text-3xl uppercase tracking-[0.08em] text-white">
                          Intake
                        </p>
                        <p className="mt-2 max-w-xs text-sm leading-7 text-zinc-300">
                          Clients see the path early, instead of guessing what happens after they start.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 p-5">
                    <div className="mb-5 h-24 rounded-[1rem] bg-[linear-gradient(140deg,rgba(198,169,107,0.24)_0%,rgba(255,255,255,0.08)_100%)]" />
                    <p className="font-display text-3xl uppercase tracking-[0.08em] text-white">
                      Review
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">
                      AI and admin review stay controlled before anything gets approved.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 p-5">
                    <div className="mb-5 flex h-24 items-end gap-2 rounded-[1rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.12)_0%,rgba(198,169,107,0.08)_100%)] p-4">
                      <span className="h-8 w-8 rounded-full border border-white/10 bg-white/10" />
                      <span className="h-12 w-12 rounded-full border border-accent/25 bg-accent/20" />
                      <span className="h-6 flex-1 rounded-full border border-white/10 bg-white/10" />
                    </div>
                    <p className="font-display text-3xl uppercase tracking-[0.08em] text-white">
                      Mailing
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">
                      Certified-mail release only happens after the work is complete and payment is valid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 text-xs uppercase tracking-[0.24em] text-zinc-500 md:bottom-0 md:left-0 md:translate-x-0">
          <span>Scroll</span>
          <span className="inline-flex h-10 w-6 items-start justify-center rounded-full border border-white/12 p-1">
            <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
          </span>
        </div>
      </div>
    </section>
  );
}
