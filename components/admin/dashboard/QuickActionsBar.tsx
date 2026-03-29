import Link from "next/link";
import { signOutAdmin } from "@/lib/auth";
import type { AdminDashboardViewModel } from "@/types/adminDashboard";

const actionClasses = {
  default: "border-white/10 bg-white/[0.06] text-white hover:border-accent/35 hover:bg-accent/10",
  accent: "border-accent/20 bg-accent/10 text-accent hover:bg-accent/18",
  sky: "border-sky-400/20 bg-sky-500/10 text-sky-100 hover:bg-sky-500/18",
  danger: "border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/18",
} as const;

export function QuickActionsBar({ model }: { model: AdminDashboardViewModel }) {
  return (
    <div className="flex flex-wrap gap-3">
      {model.quickActions.map((action) =>
        action.type === "sign_out" ? null : (
          <Link
            key={action.id}
            href={action.href ?? "/admin"}
            className={`inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border px-4 text-sm font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 ${actionClasses[action.variant]}`}
          >
            {action.label}
          </Link>
        ),
      )}
      <form action={signOutAdmin}>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-rose-400/20 bg-rose-500/10 px-4 text-sm font-semibold uppercase tracking-[0.1em] text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-500/18"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
