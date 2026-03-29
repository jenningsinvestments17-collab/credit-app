import Link from "next/link";
import { AuthRateLimitNotice } from "@/components/auth/AuthRateLimitNotice";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { SupportBlock } from "@/components/ui/SupportBlock";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; email?: string; next?: string };
}) {
  const email = searchParams?.email ?? "";
  const hasError = searchParams?.error === "1";
  const rateLimited = searchParams?.error === "rate_limited";
  const next = searchParams?.next ?? "/admin";

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.16),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(255,255,255,0.8),transparent_16%)]" />

        <div className="relative grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="panel-light">
            <div className="space-y-5">
              <div className="space-y-4">
                <p className="eyebrow">Admin login</p>
                <h1 className="display-title-lg text-text-dark">Open internal control.</h1>
                <p className="section-copy max-w-none">
                  Use the dedicated admin sign-in to manage lead flow, review disputes,
                  control mailing, and track the internal pipeline.
                </p>
              </div>

              <AdminLoginForm email={email} hasError={hasError} next={next} />
              <AuthRateLimitNotice show={rateLimited} />

              <p className="text-sm leading-7 text-zinc-500">
                Admin access uses the bootstrap super admin or invited admin accounts backed by the new auth database layer.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
                >
                  Back Home
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-surface-light-soft px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
                >
                  Client Login
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-5">
            <SupportBlock
              eyebrow="Admin access"
              title="Internal workflow only."
              items={[
                "This route is separate from the client portal login.",
                "Use admin access for lead review, mail queue control, and dispute workflow handling.",
                "Client intake, uploads, and portal continuation stay on the client side of the site.",
              ]}
            />

            <section className="panel-dark-soft">
              <div className="space-y-4">
                <p className="eyebrow">Need the portal instead?</p>
                <h2 className="display-title text-3xl md:text-5xl">
                  Keep client and admin access separate.
                </h2>
                <p className="text-sm leading-7 text-zinc-400">
                  Returning clients should use the portal login. Admin access stays separate so the
                  internal workflow is easier to control and harder to confuse with client progress.
                </p>
              </div>
            </section>
          </section>
        </div>
      </section>
    </div>
  );
}
