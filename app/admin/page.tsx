import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { AdminDashboardView } from "@/components/admin/dashboard/AdminDashboardView";
import { requireAuthenticatedAdmin } from "@/lib/auth";
import { buildAdminDashboardViewModel } from "@/lib/services/adminDashboardService";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { reminder?: string; q?: string };
}) {
  const admin = await requireAuthenticatedAdmin();
  const model = await buildAdminDashboardViewModel({
    adminEmail: admin.email,
    adminRole: admin.role,
    query: searchParams?.q,
    reminder: searchParams?.reminder,
  });

  return (
    <>
      <AdminAutoRefresh />
      <AdminDashboardView model={model} />
    </>
  );
}
