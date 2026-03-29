export function AuthRateLimitNotice({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <div className="rounded-[1rem] border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-800">
      Too many attempts. Please wait a few minutes and try again.
    </div>
  );
}
