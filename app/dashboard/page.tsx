import { ClientDashboardView } from "@/components/client/dashboard/ClientDashboardView";
import { requireAuthenticatedClientLead } from "@/lib/auth";
import { buildClientDashboardViewModel } from "@/lib/services/dashboardService";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: {
    resume?: string;
    mailingPayment?: string;
    status?: string;
    checkout?: string;
    updatePaymentMethod?: string;
  };
}) {
  const lead = await requireAuthenticatedClientLead();
  const model = await buildClientDashboardViewModel({
    lead,
    searchParams,
  });

  return <ClientDashboardView model={model} />;
}
