import Link from "next/link";
import type { ClientDashboardViewModel } from "@/types/dashboard";

export function SupportPanel({ model }: { model: ClientDashboardViewModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111214]/94 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] md:p-7">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <p className="eyebrow">Support</p>
          <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-white md:text-5xl">
            Need help moving?
          </h2>
          <p className="text-base leading-8 text-zinc-300">
            If something feels blocked, the fastest move is usually finishing the next required step inside the portal. If you still need help, reach out and we can point you to the right next action.
          </p>
          <div className="rounded-[1.25rem] border border-accent/20 bg-accent/10 px-4 py-4 text-sm leading-7 text-[#f0ddb0]">
            Contact support by replying to your portal emails or returning to the intake flow if the dashboard tells you uploads are still required.
          </div>
          <Link
            href="/book"
            className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
          >
            Book A Call
          </Link>
        </div>

        <div className="grid gap-3">
          {model.supportFaqs.map((item) => (
            <div
              key={item}
              className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
