type OperationsHealthModel = {
  metrics: Record<string, string>;
  durations: Array<{
    metric: string;
    count: number;
    avgMs: number;
    maxMs: number;
    lastMs: number;
  }>;
  errors: Array<{
    scope: string;
    message: string;
    createdAt: string;
  }>;
};

export function OperationsHealthPanel({ model }: { model: OperationsHealthModel }) {
  const metricRows = Object.entries(model.metrics).slice(0, 6);

  return (
    <section className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-panel md:p-7">
      <div className="space-y-3">
        <p className="eyebrow">Operations health</p>
        <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark md:text-5xl">
          Queue pressure, errors, and response timing.
        </h2>
        <p className="text-base leading-8 text-zinc-600">
          This view is built for multi-instance operation. It reads shared Redis-backed counters instead of local process memory.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Tracked counters</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {metricRows.length}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Slow metrics</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.durations.length}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-black/10 bg-surface-light-soft px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Recent errors</p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em] text-text-dark">
            {model.errors.length}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-5">
          <p className="eyebrow">Queue and workflow counters</p>
          <div className="mt-4 grid gap-3">
            {metricRows.length ? (
              metricRows.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4"
                >
                  <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                    {key.replaceAll(".", " ")}
                  </p>
                  <span className="text-sm leading-7 text-zinc-700">{value}</span>
                </div>
              ))
            ) : (
              <div className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4 text-sm leading-7 text-zinc-600">
                No shared counters have been recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-black/10 bg-white/80 p-5">
          <p className="eyebrow">Latency and failures</p>
          <div className="mt-4 grid gap-3">
            {model.durations.slice(0, 5).map((row) => (
              <div
                key={row.metric}
                className="rounded-[1.1rem] border border-black/10 bg-surface-light-soft px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold uppercase tracking-[0.08em] text-text-dark">
                    {row.metric.replaceAll(".", " ")}
                  </p>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-700">
                    Max {row.maxMs}ms
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  Avg {row.avgMs}ms across {row.count} runs. Last {row.lastMs}ms.
                </p>
              </div>
            ))}
            {model.errors.slice(0, 3).map((error, index) => (
              <div
                key={`${error.scope}-${index}`}
                className="rounded-[1.1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4"
              >
                <p className="font-semibold uppercase tracking-[0.08em] text-rose-700">
                  {error.scope.replaceAll(".", " ")}
                </p>
                <p className="mt-2 text-sm leading-7 text-rose-700">{error.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
