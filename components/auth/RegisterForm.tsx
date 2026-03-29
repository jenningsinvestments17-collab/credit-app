type RegisterFormProps = {
  error?: string;
};

export function RegisterForm({ error = "" }: RegisterFormProps) {
  return (
    <form action="/api/auth/register" method="post" className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent">First Name</span>
          <input
            type="text"
            name="firstName"
            required
            className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent">Last Name</span>
          <input
            type="text"
            name="lastName"
            required
            className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
          />
        </label>
      </div>
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent">Email</span>
          <input
            type="email"
            name="email"
            required
            className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent">Phone</span>
          <input
            type="tel"
            name="phone"
            className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={12}
            className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent">Confirm Password</span>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={12}
            className="min-h-14 rounded-[1rem] border border-black/10 bg-white px-4 text-base text-text-dark outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="inline-flex min-h-14 w-full items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-6 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
      >
        Create Client Account
      </button>
    </form>
  );
}
