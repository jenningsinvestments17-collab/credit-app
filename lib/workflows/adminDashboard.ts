import type { buildAdminCommandCenter } from "@/lib/services/adminCommandCenter";
import type { buildAdminProfitDashboard } from "@/lib/services/adminProfitDashboard";
import type { getAdminNotificationAlerts } from "@/lib/services/notifications";
import type { getOpsDashboardModel } from "@/lib/monitoring/ops";
import type {
  AdminDashboardAlertItem,
  AdminDashboardChartPoint,
  AdminDashboardKpi,
  AdminDashboardPipelineColumn,
  AdminDashboardQuickAction,
  AdminDashboardViewModel,
} from "@/types/adminDashboard";

type CommandCenterModel = Awaited<ReturnType<typeof buildAdminCommandCenter>>;
type ProfitModel = Awaited<ReturnType<typeof buildAdminProfitDashboard>>;
type NotificationModel = Awaited<ReturnType<typeof getAdminNotificationAlerts>>;
type OpsModel = Awaited<ReturnType<typeof getOpsDashboardModel>>;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatStatusLabel(input: string) {
  return input.replaceAll("_", " ");
}

export function buildAdminDashboardViewState(input: {
  adminEmail: string;
  adminRole: string;
  query: string;
  reminder?: string;
  commandCenter: CommandCenterModel;
  profitDashboard: ProfitModel;
  notificationAlerts: NotificationModel;
  opsHealth: OpsModel;
}): AdminDashboardViewModel {
  const {
    adminEmail,
    adminRole,
    query,
    reminder,
    commandCenter,
    profitDashboard,
    notificationAlerts,
    opsHealth,
  } = input;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = normalizedQuery
    ? commandCenter.sections
        .map((section) => ({
          ...section,
          leads: section.leads.filter((lead) => {
            const haystack = [lead.fullName, lead.email, lead.source, lead.notes.join(" ")]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return haystack.includes(normalizedQuery);
          }),
        }))
        .filter((section) => section.leads.length > 0)
    : commandCenter.sections;

  const kpis: AdminDashboardKpi[] = [
    {
      id: "revenue-today",
      label: "Revenue today",
      value: formatCurrency(profitDashboard.revenueTodayCents),
      tone: "emerald",
    },
    {
      id: "revenue-week",
      label: "Revenue week",
      value: formatCurrency(profitDashboard.revenueWeekCents),
      tone: "accent",
    },
    {
      id: "conversion",
      label: "Conversion",
      value: `${profitDashboard.conversionRate}%`,
      tone: "sky",
    },
    {
      id: "pending-payments",
      label: "Pending payments",
      value: String(profitDashboard.pendingPaymentCount),
      tone: "amber",
    },
    {
      id: "avg-time",
      label: "Avg. time to payment",
      value: profitDashboard.avgHoursToPayment ? `${profitDashboard.avgHoursToPayment}h` : "--",
      tone: "fuchsia",
    },
  ];

  const caseAlerts: AdminDashboardAlertItem[] = [
    ...profitDashboard.alerts.failedPayments.map((item, index) => ({
      id: `failed-${index}`,
      title: item.label,
      detail: `${item.status}${item.reason ? ` • ${item.reason}` : ""}`,
      tone: "rose" as const,
    })),
    ...profitDashboard.alerts.missingDocs.map((item, index) => ({
      id: `missing-${index}`,
      title: item.label,
      detail: `${item.waitingHours}h waiting`,
      tone: "amber" as const,
    })),
    ...profitDashboard.alerts.stalledCases.map((item, index) => ({
      id: `stalled-${index}`,
      title: item.label,
      detail: `${formatStatusLabel(item.stage)} • ${item.waitingHours}h waiting`,
      tone: "sky" as const,
    })),
  ];

  const notificationItems: AdminDashboardAlertItem[] = notificationAlerts.alerts.map((item) => ({
    id: item.id,
    title: formatStatusLabel(item.title),
    detail: `${item.channel} • ${formatStatusLabel(item.status)} • ${item.note}`,
    tone: item.status === "failed" ? "rose" : item.status === "pending" ? "amber" : "sky",
  }));

  const opsItems: AdminDashboardAlertItem[] = opsHealth.errors.slice(0, 6).map((error, index) => ({
    id: `ops-${index}`,
    title: formatStatusLabel(error.scope),
    detail: error.message,
    tone: "rose",
  }));

  const pipeline: AdminDashboardPipelineColumn[] = filteredSections.map((section) => ({
    id: section.id,
    title: section.title,
    helper: section.helper,
    cards: section.leads.map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      email: lead.email,
      statusLabel: section.title,
      href: `/admin/leads/${lead.id}`,
    })),
  }));

  const quickActions: AdminDashboardQuickAction[] = [
    {
      id: "open-mailing",
      label: "Open Certified Mail Queue",
      href: "/admin/mailing",
      variant: "default",
      type: "link",
    },
    {
      id: "view-leads",
      label: "View Leads",
      href: "/admin/leads",
      variant: "sky",
      type: "link",
    },
    {
      id: "view-payments",
      label: "View Payments",
      href: "/admin/payments",
      variant: "accent",
      type: "link",
    },
    {
      id: "view-alerts",
      label: "View Alerts",
      href: "/admin/alerts",
      variant: "danger",
      type: "link",
    },
  ];

  return {
    adminEmail,
    adminRole,
    query,
    notificationCount: notificationAlerts.summary.pending + notificationAlerts.summary.failed,
    reminderMessage: reminder ? reminder.replaceAll("-", " ") : undefined,
    kpis,
    funnel: profitDashboard.funnel,
    revenueQueue: profitDashboard.revenueQueue,
    alerts: {
      caseAlerts,
      notificationAlerts: notificationItems,
      opsAlerts: opsItems,
    },
    pipeline,
    revenueSeries: profitDashboard.revenueSeries.map(
      (item): AdminDashboardChartPoint => ({
        label: item.label,
        value: item.totalCents,
      }),
    ),
    conversionTrend: profitDashboard.conversionTrend.map(
      (item): AdminDashboardChartPoint => ({
        label: item.label,
        value: item.conversionRate,
      }),
    ),
    quickActions,
  };
}
