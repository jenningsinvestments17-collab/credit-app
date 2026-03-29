import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-surface-light">
      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-5 py-10 text-sm text-[#52525b] md:px-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-display text-2xl uppercase tracking-[0.06em] text-text-dark">
            Credu Consulting
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">From pressure to freedom</p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500 md:justify-end">
            <Link href="/book" className="hover:text-accent">
              Book Consultation
            </Link>
            <Link href="/intake" className="hover:text-accent">
              Intake
            </Link>
            <Link href="/login" className="hover:text-accent">
              Client Login
            </Link>
          </div>
          <p className="max-w-xl leading-7 md:text-right">
            A credit repair experience shaped to feel clear, elevated, and forward-moving
            from the first view to the final action.
          </p>
        </div>
      </div>
    </footer>
  );
}
