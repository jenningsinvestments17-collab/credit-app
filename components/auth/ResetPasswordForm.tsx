type ResetPasswordFormProps = {
  token?: string;
  hasError?: boolean;
};

export function ResetPasswordForm({
  token = "",
  hasError = false,
}: ResetPasswordFormProps) {
  return (
    <form action="/api/auth/password-reset/confirm" method="post" className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent">New Password</span>
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

      {hasError ? (
        <div className="rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-7 text-rose-700">
          The reset link is invalid or expired.
        </div>
      ) : null}

      <button
        type="submit"
        className="inline-flex min-h-14 w-full items-center justify-center rounded-[0.95rem] border border-accent/70 bg-accent px-6 text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-soft hover:bg-accent-soft"
      >
        Save New Password
      </button>
    </form>
  );
}
