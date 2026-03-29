import Link from "next/link";
import { AuthRateLimitNotice } from "@/components/auth/AuthRateLimitNotice";
import { verifyEmailAction } from "@/lib/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { token?: string; sent?: string; verified?: string; error?: string };
}) {
  const verified =
    searchParams?.verified === "1" ||
    (searchParams?.token ? await verifyEmailAction(searchParams.token) : false);
  const rateLimited = searchParams?.error === "rate_limited";

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.16),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(255,255,255,0.8),transparent_16%)]" />
        <div className="relative grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="panel-light">
            <div className="space-y-5">
              <div className="space-y-4">
                <p className="eyebrow">Email verification</p>
                <h1 className="display-title-lg text-text-dark">
                  {verified ? "Your email is verified." : "Check your verification link."}
                </h1>
                <p className="section-copy max-w-none">
                  {verified
                    ? "Your client account is now verified and ready for portal sign-in."
                    : searchParams?.error === "1"
                      ? "The verification link is invalid or expired."
                    : searchParams?.sent === "1"
                      ? "A verification link has been issued for your account."
                      : "Use the verification link from your email to activate your account."}
                </p>
              </div>
              <AuthRateLimitNotice show={rateLimited} />
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
              >
                Go To Login
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
