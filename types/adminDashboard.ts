export type AdminDashboardKpi = {
  id: string;
  label: string;
  value: string;
  tone: "emerald" | "accent" | "sky" | "amber" | "fuchsia";
};

export type AdminDashboardFunnelStep = {
  step: string;
  label: string;
  users: number;
  dropOffPercentage: number;
};

export type AdminRevenueQueueItem = {
  disputeId: string;
  leadId: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  amountCents: number;
  status: string;
  waitingHours: number;
  requestedAt: string;
};

export type AdminDashboardAlertItem = {
  id: string;
  title: string;
  detail: string;
  tone: "rose" | "amber" | "sky";
};

export type AdminDashboardPipelineCard = {
  id: string;
  fullName: string;
  email: string;
  statusLabel: string;
  href: string;
};

export type AdminDashboardPipelineColumn = {
  id: string;
  title: string;
  helper: string;
  cards: AdminDashboardPipelineCard[];
};

export type AdminDashboardChartPoint = {
  label: string;
  value: number;
};

export type AdminDashboardQuickAction = {
  id: string;
  label: string;
  href?: string;
  variant: "default" | "accent" | "danger" | "sky";
  type?: "link" | "sign_out";
};

export type AdminDashboardViewModel = {
  adminEmail: string;
  adminRole: string;
  query: string;
  notificationCount: number;
  reminderMessage?: string;
  kpis: AdminDashboardKpi[];
  funnel: AdminDashboardFunnelStep[];
  revenueQueue: AdminRevenueQueueItem[];
  alerts: {
    caseAlerts: AdminDashboardAlertItem[];
    notificationAlerts: AdminDashboardAlertItem[];
    opsAlerts: AdminDashboardAlertItem[];
  };
  pipeline: AdminDashboardPipelineColumn[];
  revenueSeries: AdminDashboardChartPoint[];
  conversionTrend: AdminDashboardChartPoint[];
  quickActions: AdminDashboardQuickAction[];
};
