type AdminAlertsModel = {
  summary: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
  };
  alerts: Array<{
    id: string;
    title: string;
    status: string;
    channel: string;
    note: string;
    createdAt: string;
  }>;
};

function statusTone(status: string) {
  if (status === "failed") {
    return "border-rose-400/25 bg-rose-500/12 text-rose-700";
  }

  if (status === "sent") {
    return "border-emerald-400/25 bg-emerald-500/12 text-emerald-700";
  }

  return "border-amber-400/25 bg-amber-500/12 text-amber-700";
}

export function AdminAlertsPanel({ model }: { model: AdminAlertsModel }) {
  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Admin alerts</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark md:text-5xl">
          Notifications and delivery pressure.
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          These alerts come from the workflow service layer, so admin can see what was queued, delivered, or failed without exposing raw client data.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Queued jobs</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.summary.total}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Pending</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.summary.pending}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Sent</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.summary.sent}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Failed</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.summary.failed}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {model.alerts.length ? (
          model.alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                    {alert.title}
                  </p>
                  <p className="text-sm leading-7 text-zinc-600">{alert.note}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${statusTone(alert.status)}`}>
                    {alert.status}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-700">
                    {alert.channel}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-600">
            No admin alerts are queued right now.
          </div>
        )}
      </div>
    </section>
  );
}
