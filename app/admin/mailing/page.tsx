import Link from "next/link";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { PipelineBoard } from "@/components/admin/dashboard/PipelineBoard";
import { QuickActionsBar } from "@/components/admin/dashboard/QuickActionsBar";
import { AdminTopBar } from "@/components/admin/dashboard/AdminTopBar";
import { MailQueuePanel } from "@/components/admin/MailQueuePanel";
import { requireAuthenticatedAdmin } from "@/lib/auth";
import { buildAdminDashboardViewModel } from "@/lib/services/adminDashboardService";

export const dynamic = "force-dynamic";

export default async function AdminMailingPage({
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
  const mailingPipeline = {
    ...model,
    pipeline: model.pipeline.filter((section) =>
      ["approved-disputes", "payment-pending", "mail-queue", "failed-jobs"].includes(section.id),
    ),
  };

  return (
    <div className="page-rhythm">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(198,169,107,0.18),transparent_22%),linear-gradient(180deg,#09090b_0%,#111216_100%)]" />
        <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <AdminAutoRefresh />
          <AdminTopBar model={model} />
          <QuickActionsBar model={model} />
          <div className="flex justify-end">
            <Link
              href="/admin/mail-queue"
              className="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:bg-accent/10"
            >
              Open legacy mail queue
            </Link>
          </div>
          <MailQueuePanel />
          <PipelineBoard model={mailingPipeline} />
        </div>
      </section>
    </div>
  );
}
