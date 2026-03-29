import type { AdminDashboardViewModel } from "@/types/adminDashboard";

export function AdminTopBar({ model }: { model: AdminDashboardViewModel }) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-[#111113]/92 p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <p className="eyebrow">Profit command</p>
          <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-[0.03em] text-white">
            Admin dashboard.
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
          <form method="GET" action="/admin" className="min-w-0">
            <label className="sr-only" htmlFor="admin-search">
              Search clients
            </label>
            <div className="flex min-h-12 items-center rounded-[1rem] border border-white/10 bg-white/[0.06] px-4 shadow-[0_0_0_1px_rgba(198,169,107,0.04)]">
              <input
                id="admin-search"
                name="q"
                defaultValue={model.query}
                placeholder="Search client, email, source"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
          </form>

          <div className="flex min-h-12 items-center gap-3 rounded-[1rem] border border-accent/20 bg-accent/10 px-4 text-sm uppercase tracking-[0.12em] text-accent">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-[11px] font-semibold">
              {model.notificationCount}
            </span>
            Alerts
          </div>

          <div className="flex min-h-12 items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.06] px-4 text-sm text-zinc-300">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] font-semibold text-white">
              {model.adminEmail.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-white">{model.adminEmail}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {model.adminRole.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
