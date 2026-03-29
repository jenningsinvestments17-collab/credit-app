import type { ReactNode } from "react";
import Link from "next/link";
import { ProgressHeader } from "@/components/client/intake/ProgressHeader";
import type { IntakeViewModel } from "@/types/intake";

function getBannerStyles(tone: IntakeViewModel["banners"][number]["tone"]) {
  if (tone === "success") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  if (tone === "warning") return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  return "border-sky-400/20 bg-sky-500/10 text-sky-100";
}

export function IntakeShell({
  model,
  children,
}: {
  model: IntakeViewModel;
  children: ReactNode;
}) {
  return (
    <div className="page-rhythm">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(198,169,107,0.14),transparent_22%),linear-gradient(180deg,#09090b_0%,#0e1013_48%,#111317_100%)]" />

        <div className="relative mx-auto flex w-full max-w-[1350px] flex-col gap-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:p-7">
            <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
              <div className="space-y-4">
                <p className="eyebrow">Intake</p>
                <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-[0.03em] text-white md:text-6xl">
                  Guided onboarding.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-zinc-300">
                  Step-locked progression, secure uploads, and a clear resume point every time the client comes back.
                </p>
              </div>

              <div className="grid gap-3">
                {model.banners.map((banner) => (
                  <div key={banner.id} className={`rounded-[1rem] border px-4 py-4 text-sm leading-7 ${getBannerStyles(banner.tone)}`}>
                    {banner.text}
                  </div>
                ))}
                <div className="rounded-[1rem] border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-100">
                  {model.acknowledgments.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ProgressHeader model={model} />

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="grid gap-4">
              {model.progressSteps.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-[1.25rem] border p-4 ${
                    step.status === "complete"
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                      : step.status === "current"
                        ? "border-accent/25 bg-accent/10 text-[#f0ddb0]"
                        : "border-white/10 bg-white/[0.04] text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold uppercase tracking-[0.08em]">{step.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.18em]">{step.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7">{step.helper}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6">
              {children}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={model.resumeHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
                >
                  Resume Current Step
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
                >
                  Back To Dashboard
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
