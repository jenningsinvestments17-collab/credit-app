import Link from "next/link";

export function LockedStepNotice({
  title,
  copy,
  href,
}: {
  title: string;
  copy: string;
  href: string;
}) {
  return (
    <section className="rounded-[1.7rem] border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
      <p className="eyebrow">Step locked</p>
      <h3 className="mt-3 font-display text-4xl uppercase leading-[0.92] tracking-[0.03em]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7">{copy}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-white/15 bg-white/[0.08] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
      >
        Go to unlocked step
      </Link>
    </section>
  );
}
