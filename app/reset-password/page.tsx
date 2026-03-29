import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { token?: string; error?: string };
}) {
  const token = searchParams?.token ?? "";

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.16),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(255,255,255,0.8),transparent_16%)]" />
        <div className="relative grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="panel-light">
            <div className="space-y-5">
              <div className="space-y-4">
                <p className="eyebrow">Reset password</p>
                <h1 className="display-title-lg text-text-dark">Set a new password.</h1>
              </div>
              <ResetPasswordForm token={token} hasError={searchParams?.error === "1"} />
            </div>
          </section>
          <section className="panel-dark-soft">
            <div className="space-y-4">
              <p className="eyebrow">Back to access</p>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/12 bg-white/[0.06] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white/[0.11] hover:text-accent"
              >
                Client Login
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
