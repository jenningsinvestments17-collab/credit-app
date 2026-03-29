import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { AlertCenter } from "@/components/admin/dashboard/AlertCenter";
import { QuickActionsBar } from "@/components/admin/dashboard/QuickActionsBar";
import { AdminTopBar } from "@/components/admin/dashboard/AdminTopBar";
import { OperationsHealthPanel } from "@/components/admin/OperationsHealthPanel";
import { requireAuthenticatedAdmin } from "@/lib/auth";
import { buildAdminDashboardViewModel } from "@/lib/services/adminDashboardService";
import { getOpsDashboardModel } from "@/lib/monitoring/ops";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const admin = await requireAuthenticatedAdmin();
  const [model, ops] = await Promise.all([
    buildAdminDashboardViewModel({
      adminEmail: admin.email,
      adminRole: admin.role,
      query: searchParams?.q,
    }),
    getOpsDashboardModel(),
  ]);

  return (
    <div className="page-rhythm">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(198,169,107,0.18),transparent_22%),linear-gradient(180deg,#09090b_0%,#111216_100%)]" />
        <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <AdminAutoRefresh />
          <AdminTopBar model={model} />
          <QuickActionsBar model={model} />
          <AlertCenter model={model} />
          <OperationsHealthPanel model={ops} />
        </div>
      </section>
    </div>
  );
}
