import { AdminTopBar } from "@/components/admin/dashboard/AdminTopBar";
import { AlertCenter } from "@/components/admin/dashboard/AlertCenter";
import { FunnelPanel } from "@/components/admin/dashboard/FunnelPanel";
import { KpiStrip } from "@/components/admin/dashboard/KpiStrip";
import { PerformanceCharts } from "@/components/admin/dashboard/PerformanceCharts";
import { PipelineBoard } from "@/components/admin/dashboard/PipelineBoard";
import { QuickActionsBar } from "@/components/admin/dashboard/QuickActionsBar";
import { RevenueQueueTable } from "@/components/admin/dashboard/RevenueQueueTable";
import type { AdminDashboardViewModel } from "@/types/adminDashboard";

export function AdminDashboardView({ model }: { model: AdminDashboardViewModel }) {
  return (
    <div className="page-rhythm">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(198,169,107,0.18),transparent_22%),radial-gradient(circle_at_85%_0%,rgba(74,222,128,0.08),transparent_24%),linear-gradient(180deg,#09090b_0%,#0f1014_42%,#111216_100%)]" />

        <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <AdminTopBar model={model} />
          <QuickActionsBar model={model} />

          {model.reminderMessage ? (
            <div className="rounded-[1.3rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-100">
              Reminder update: {model.reminderMessage}.
            </div>
          ) : null}

          <KpiStrip model={model} />
          <FunnelPanel model={model} />

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <RevenueQueueTable model={model} />
            <AlertCenter model={model} />
          </div>

          <PipelineBoard model={model} />
          <PerformanceCharts model={model} />
        </div>
      </section>
    </div>
  );
}
