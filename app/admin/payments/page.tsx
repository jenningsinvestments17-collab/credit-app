import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { KpiStrip } from "@/components/admin/dashboard/KpiStrip";
import { PerformanceCharts } from "@/components/admin/dashboard/PerformanceCharts";
import { QuickActionsBar } from "@/components/admin/dashboard/QuickActionsBar";
import { RevenueQueueTable } from "@/components/admin/dashboard/RevenueQueueTable";
import { AdminTopBar } from "@/components/admin/dashboard/AdminTopBar";
import { requireAuthenticatedAdmin } from "@/lib/auth";
import { buildAdminDashboardViewModel } from "@/lib/services/adminDashboardService";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: { q?: string; reminder?: string };
}) {
  const admin = await requireAuthenticatedAdmin();
  const model = await buildAdminDashboardViewModel({
    adminEmail: admin.email,
    adminRole: admin.role,
    query: searchParams?.q,
    reminder: searchParams?.reminder,
  });

  return (
    <div className="page-rhythm">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(198,169,107,0.18),transparent_22%),linear-gradient(180deg,#09090b_0%,#111216_100%)]" />
        <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <AdminAutoRefresh />
          <AdminTopBar model={model} />
          <QuickActionsBar model={model} />
          {model.reminderMessage ? (
            <div className="rounded-[1.3rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-100">
              Reminder update: {model.reminderMessage}.
            </div>
          ) : null}
          <KpiStrip model={model} />
          <RevenueQueueTable model={model} />
          <PerformanceCharts model={model} />
        </div>
      </section>
    </div>
  );
}
