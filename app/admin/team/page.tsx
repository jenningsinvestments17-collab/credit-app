import Link from "next/link";
import { createAdminUserAction, requireSuperAdmin } from "@/lib/auth";
import { listAdminAccounts } from "@/lib/adminUsers";
import { SupportBlock } from "@/components/ui/SupportBlock";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams?: { created?: string; error?: string };
}) {
  const admin = await requireSuperAdmin();
  const admins = await listAdminAccounts();
  const created = searchParams?.created === "1";
  const error = searchParams?.error ?? "";

  return (
    <div className="page-rhythm">
      <section className="page-shell-light relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,169,107,0.14),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(198,169,107,0.04)_100%)]" />

        <div className="relative section-stack">
          <div className="section-intro">
            <div className="space-y-4">
              <p className="eyebrow">Admin team</p>
              <h1 className="display-title-lg text-text-dark">Super admin control.</h1>
            </div>
            <p className="section-copy">
              You are signed in as {admin.email}. Use this page to create additional admin
              accounts without mixing client and internal access.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex min-h-11 items-center justify-center rounded-[0.9rem] border border-black/10 bg-white px-4 text-sm font-semibold uppercase tracking-[0.08em] text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:text-[#7d6434]"
              >
                Back To Admin
              </Link>
            </div>
          </div>

          {created ? (
            <div className="rounded-[1rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm leading-7 text-emerald-700">
              New admin created successfully.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <section className="panel-light">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="eyebrow">Add admin</p>
                  <h2 className="display-title text-3xl text-text-dark md:text-5xl">
                    Create another admin account.
                  </h2>
                  <p className="text-sm leading-7 text-zinc-600">
                    This is the internal admin user store for the current platform prototype.
                  </p>
                </div>

                <form action={createAdminUserAction} className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-accent">
                      Email
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-accent">
                      Password
                    </span>
                    <input
                      type="text"
                      name="password"
                      required
                      className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-accent">
                      Role
                    </span>
                    <select
                      name="role"
                      defaultValue="admin"
                      className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-14 items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-6 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
                  >
                    Create Admin
                  </button>
                </form>
              </div>
            </section>

            <section className="grid gap-5">
              <SupportBlock
                eyebrow="Current admins"
                title="Internal access list."
                items={admins.map((item) => `${item.email} | ${item.role.replaceAll("_", " ")}`)}
              />

              <SupportBlock
                eyebrow="Prototype note"
                title="Ready for stronger auth later."
                items={[
                  "This prototype stores admin credentials in the local app data store for now.",
                  "The structure is ready to move into PostgreSQL and real password hashing later.",
                  "Client portal login and admin login now stay fully separate.",
                ]}
              />
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
