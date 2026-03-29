import Link from "next/link";
import { signOutClient } from "@/lib/auth";
import { DisputeTimeline } from "@/components/client/dashboard/DisputeTimeline";
import { DocumentCenter } from "@/components/client/dashboard/DocumentCenter";
import { HeroStatusPanel } from "@/components/client/dashboard/HeroStatusPanel";
import { JourneyStepsPanel } from "@/components/client/dashboard/JourneyStepsPanel";
import { MailingTrackingCard } from "@/components/client/dashboard/MailingTrackingCard";
import { PaymentStatusCard } from "@/components/client/dashboard/PaymentStatusCard";
import { SupportPanel } from "@/components/client/dashboard/SupportPanel";
import type { ClientDashboardViewModel } from "@/types/dashboard";

function getBannerStyles(tone: ClientDashboardViewModel["banners"][number]["tone"]) {
  if (tone === "success") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
  if (tone === "warning") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }
  return "border-sky-400/20 bg-sky-500/10 text-sky-100";
}

export function ClientDashboardView({ model }: { model: ClientDashboardViewModel }) {
  return (
    <div className="page-rhythm">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.16),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(56,189,248,0.08),transparent_24%),linear-gradient(180deg,#09090b_0%,#0e1013_48%,#111317_100%)]" />

        <div className="relative mx-auto flex w-full max-w-[1450px] flex-col gap-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:p-7">
            <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
              <div className="space-y-4">
                <p className="eyebrow">Client portal</p>
                <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-[0.03em] text-white md:text-6xl">
                  Welcome back, {model.leadFirstName}.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-zinc-300">
                  Your dashboard is built around the live step, the next required move, and the exact handoff from uploads to review to payment to mailing.
                </p>
              </div>

              <div className="grid gap-3">
                {model.banners.map((banner) => (
                  <div key={banner.id} className={`rounded-[1rem] border px-4 py-4 text-sm leading-7 ${getBannerStyles(banner.tone)}`}>
                    {banner.text}
                    {banner.href && banner.hrefLabel ? (
                      <>
                        {" "}
                        <a
                          className="font-semibold text-white underline decoration-accent/60 underline-offset-4"
                          href={banner.href}
                        >
                          {banner.hrefLabel}
                        </a>
                      </>
                    ) : null}
                  </div>
                ))}

                <div className="rounded-[1rem] border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-100">
                  {model.disclaimers.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <HeroStatusPanel model={model} />
          <JourneyStepsPanel model={model} />
          <DocumentCenter model={model} />
          <DisputeTimeline model={model} />
          <PaymentStatusCard model={model} />
          <MailingTrackingCard model={model} />
          <SupportPanel model={model} />

          <div className="flex flex-col gap-3 rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="eyebrow">Quick actions</p>
              <p className="text-sm leading-7 text-zinc-300">
                Use the portal to continue your workflow or sign out safely when you are done.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {model.contractPacketOpen ? (
                <Link
                  href="/dashboard/contracts"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
                >
                  View Contracts
                </Link>
              ) : (
                <Link
                  href="/intake#intake-form"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
                >
                  Resume Intake
                </Link>
              )}
              <form action={signOutClient}>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-rose-400/20 bg-rose-500/10 px-5 text-sm font-semibold uppercase tracking-[0.08em] text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-500/18"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
