import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { AdminTopBar } from "@/components/admin/dashboard/AdminTopBar";
import { PipelineBoard } from "@/components/admin/dashboard/PipelineBoard";
import { QuickActionsBar } from "@/components/admin/dashboard/QuickActionsBar";
import { requireAuthenticatedAdmin } from "@/lib/auth";
import { buildAdminDashboardViewModel } from "@/lib/services/adminDashboardService";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const admin = await requireAuthenticatedAdmin();
  const model = await buildAdminDashboardViewModel({
    adminEmail: admin.email,
    adminRole: admin.role,
    query: searchParams?.q,
  });

  return (
    <div className="page-rhythm">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(198,169,107,0.18),transparent_22%),linear-gradient(180deg,#09090b_0%,#111216_100%)]" />
        <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <AdminAutoRefresh />
          <AdminTopBar model={model} />
          <QuickActionsBar model={model} />
          <PipelineBoard model={model} />
        </div>
      </section>
    </div>
  );
}
