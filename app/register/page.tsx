import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error ?? "";

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.16),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(255,255,255,0.8),transparent_16%)]" />
        <div className="relative grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="panel-light">
            <div className="space-y-5">
              <div className="space-y-4">
                <p className="eyebrow">Client registration</p>
                <h1 className="display-title-lg text-text-dark">Secure your portal access.</h1>
                <p className="section-copy max-w-none">
                  Create your client credentials, verify your email, and move into the portal with a real account instead of a shared password.
                </p>
              </div>
              <RegisterForm error={error} />
            </div>
          </section>
          <section className="panel-dark-soft">
            <div className="space-y-4">
              <p className="eyebrow">Already registered?</p>
              <h2 className="display-title text-3xl md:text-5xl">Return to login.</h2>
              <p className="text-sm leading-7 text-zinc-400">
                Existing clients can sign in, restore their session, and continue intake, documents, and contracts without restarting.
              </p>
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
