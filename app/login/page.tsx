import Link from "next/link";
import { AuthRateLimitNotice } from "@/components/auth/AuthRateLimitNotice";
import { LoginForm } from "@/components/auth/LoginForm";
import { SupportBlock } from "@/components/ui/SupportBlock";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; email?: string; next?: string; reset?: string };
}) {
  const email = searchParams?.email ?? "";
  const hasError = searchParams?.error === "1";
  const rateLimited = searchParams?.error === "rate_limited";
  const next = searchParams?.next ?? "";

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.16),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(255,255,255,0.8),transparent_16%)]" />

        <div className="relative grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="panel-light">
            <div className="space-y-5">
              <div className="space-y-4">
                <p className="eyebrow">Client login</p>
                <h1 className="display-title-lg text-text-dark">
                  Return to your portal.
                </h1>
                <p className="section-copy max-w-none">
                  Sign in to continue your intake, review report readiness, upload
                  documents, and pick up exactly where you left off.
                </p>
              </div>

              <LoginForm email={email} hasError={hasError} next={next} />
              <AuthRateLimitNotice show={rateLimited} />

              {searchParams?.reset === "1" ? (
                <div className="rounded-[1rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-700">
                  Your password has been updated. Sign in with the new password.
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 text-sm leading-7 text-zinc-600">
                <Link href="/register" className="font-semibold text-[#7d6434]">
                  Create account
                </Link>
                <Link href="/forgot-password" className="font-semibold text-[#7d6434]">
                  Forgot password
                </Link>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-white px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
                >
                  Back Home
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-black/10 bg-surface-light-soft px-5 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-5">
            <SupportBlock
              eyebrow="Why sign in"
              title="Resume without restarting."
              items={[
                "Returning clients go straight back to the next meaningful step.",
                "Report readiness, uploads, and review status stay visible in one place.",
                "This portal foundation is ready for contracts, notifications, and future status updates.",
              ]}
            />

            <SupportBlock
              eyebrow="Admin access"
              title="Use the admin dashboard separately."
              items={[
                "This login page is for client portal sign-in only.",
                "Admin workflow now opens through the dedicated /admin/login route.",
                "If you are trying to review leads or mailing status, go straight to the admin dashboard.",
              ]}
            />

            <section className="panel-dark-soft">
              <div className="space-y-4">
                <p className="eyebrow">New here?</p>
                <h2 className="display-title text-3xl md:text-5xl">
                  Start with booking or intake.
                </h2>
                <p className="text-sm leading-7 text-zinc-400">
                  New clients should begin with a consultation or open the intake directly.
                  Returning clients should sign in to continue without losing progress.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/intake"
                    className="inline-flex min-h-14 items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-6 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
                  >
                    Start Intake
                  </Link>
                  <Link
                    href="/book"
                    className="inline-flex min-h-14 items-center justify-center rounded-[0.95rem] border border-white/12 bg-white/[0.06] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white/[0.11] hover:text-accent"
                  >
                    Book Consultation
                  </Link>
                </div>
              </div>
            </section>
          </section>
        </div>
      </section>
    </div>
  );
}
