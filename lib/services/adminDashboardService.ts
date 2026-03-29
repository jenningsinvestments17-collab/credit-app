import { getOpsDashboardModel } from "@/lib/monitoring/ops";
import { buildAdminCommandCenter } from "@/lib/services/adminCommandCenter";
import { buildAdminProfitDashboard } from "@/lib/services/adminProfitDashboard";
import { getAdminNotificationAlerts } from "@/lib/services/notifications";
import { buildAdminDashboardViewState } from "@/lib/workflows/adminDashboard";

export async function buildAdminDashboardViewModel(input: {
  adminEmail: string;
  adminRole: string;
  query?: string;
  reminder?: string;
}) {
  const [commandCenter, profitDashboard, notificationAlerts, opsHealth] = await Promise.all([
    buildAdminCommandCenter(),
    buildAdminProfitDashboard(),
    getAdminNotificationAlerts(),
    getOpsDashboardModel(),
  ]);

  return buildAdminDashboardViewState({
    adminEmail: input.adminEmail,
    adminRole: input.adminRole,
    query: input.query ?? "",
    reminder: input.reminder,
    commandCenter,
    profitDashboard,
    notificationAlerts,
    opsHealth,
  });
}
